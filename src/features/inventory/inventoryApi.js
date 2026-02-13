import { supabase } from '@/lib/supabaseClient'
import { apiSlice } from '../api/apiSlice'

export const inventoryApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getInventory: builder.query({
       queryFn: async ({ page = 1, limit = 10, search = '', lowStock = false, brand = 'all' }) => {
        try {
          const from = (page - 1) * limit
          const to = from + limit - 1
          
          let query = supabase
            .from('inventory_stock')
            .select('*, materials!inner(*)', { count: 'exact' })
            .range(from, to)
            .order('updated_at', { ascending: false })

          if (search) {
             query = query.ilike('materials.name', `%${search}%`)
          }
          
          if (brand !== 'all') {
            query = query.eq('materials.brand', brand)
          }
          
          if (lowStock) {
              // Filters for Low Stock (less than or equal to reorder_level)
              query = query.filter('quantity_available', 'lte', 'reorder_level')
          }

          const { data, error, count } = await query
          if (error) throw error
          
          return { data: { materials: data, total: count } }
        } catch (error) {
          return { error: error.message }
        }
      },
      providesTags: ['Inventory'],
    }),

    getInventoryAnalytics: builder.query({
      queryFn: async () => {
        try {
          // 1. Fetch materials + stock
          const { data: stockData, error: stockError } = await supabase
            .from('inventory_stock')
            .select('quantity_available, reorder_level, materials(unit_cost, unit_price)')

          if (stockError) throw stockError

          const totalMaterials = stockData.length
          const totalStockUnits = stockData.reduce((sum, item) => sum + Number(item.quantity_available || 0), 0)
          const lowStockItems = stockData.filter(item => Number(item.quantity_available) <= Number(item.reorder_level)).length
          const totalCostValue = stockData.reduce((sum, item) => sum + (Number(item.quantity_available) * Number(item.materials?.unit_cost || 0)), 0)
          const totalSellingValue = stockData.reduce((sum, item) => sum + (Number(item.quantity_available) * Number(item.materials?.unit_price || 0)), 0)
          const potentialProfit = totalSellingValue - totalCostValue

          // 2. Stock distribution for chart
          const healthy = stockData.filter(item => Number(item.quantity_available) > Number(item.reorder_level)).length
          const outOfStock = stockData.filter(item => Number(item.quantity_available) === 0).length
          const low = lowStockItems - outOfStock 

          return { 
            data: { 
              stats: { totalMaterials, totalStockUnits, lowStockItems, totalCostValue, totalSellingValue, potentialProfit },
              distribution: [
                { name: 'Healthy', value: healthy, color: '#10b981' },
                { name: 'Low Stock', value: low, color: '#f59e0b' },
                { name: 'Out of Stock', value: outOfStock, color: '#ef4444' }
              ]
            } 
          }
        } catch (error) {
          return { error: error.message }
        }
      },
      providesTags: ['InventoryAnalytics']
    }),

    getProjectMaterials: builder.query({
      queryFn: async ({ projectId = 'all', status = 'all', page = 1, limit = 10 }) => {
        try {
          const from = (page - 1) * limit
          const to = from + limit - 1

          let query = supabase
            .from('project_materials')
            .select('*, projects!inner(*), materials(*)', { count: 'exact' })
            .range(from, to)
            .order('created_at', { ascending: false })

          if (projectId !== 'all') query = query.eq('project_id', projectId)
          if (status !== 'all') query = query.eq('projects.project_status', status)

          const { data, error, count } = await query
          if (error) throw error

          return { data: { consumptions: data, total: count } }
        } catch (error) {
          return { error: error.message }
        }
      },
      providesTags: ['ProjectMaterials']
    }),

    getUsageTrends: builder.query({
      queryFn: async () => {
        try {
          // Top 10 Most Used Materials
          const { data: topUsed, error: topError } = await supabase
            .from('project_materials')
            .select('quantity, materials(name)')
          
          if (topError) throw topError

          const usageMap = {}
          topUsed.forEach(item => {
            const name = item.materials?.name || 'Unknown'
            usageMap[name] = (usageMap[name] || 0) + Number(item.quantity)
          })

          const top10 = Object.entries(usageMap)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([name, value]) => ({ name, value }))

          return { data: { top10 } }
        } catch (error) {
          return { error: error.message }
        }
      },
      providesTags: ['InventoryAnalytics']
    }),

    addMaterial: builder.mutation({
        queryFn: async ({ name, brand, unit, unit_cost, unit_price, initial_stock, reorder_level }) => {
          try {
            const { data: mat, error: matError } = await supabase
                .from('materials')
                .insert([{ name, brand, unit: unit || 'pcs', unit_cost, unit_price }])
                .select()
                .single()
            
            if (matError) throw matError

            const { error: stockError } = await supabase
                .from('inventory_stock')
                .insert([{ 
                  material_id: mat.id, 
                  quantity_available: initial_stock || 0, 
                  reorder_level: reorder_level || 10 
                }])
            
            if (stockError) throw stockError

            return { data: mat }
          } catch (error) {
            return { error: error.message }
          }
        },
        invalidatesTags: ['Inventory', 'InventoryAnalytics'],
      }),

    adjustStock: builder.mutation({
        queryFn: async ({ material_id, quantity, type, reason, notes }) => {
            try {
                const { data: stock, error: fetchError } = await supabase.from('inventory_stock').eq('material_id', material_id).single()
                if (fetchError) throw new Error("Stock record not found")

                let newQty = stock.quantity_available
                if (type === 'in') newQty += Number(quantity)
                else if (type === 'out') newQty -= Number(quantity)
                else newQty = Number(quantity) // set exact

                if (newQty < 0) throw new Error("Insufficient stock")

                const { error: updateError } = await supabase
                  .from('inventory_stock')
                  .update({ quantity_available: newQty, updated_at: new Date() })
                  .eq('id', stock.id)
                
                if (updateError) throw updateError

                await supabase.from('inventory_logs').insert([{
                    material_id,
                    action_type: type,
                    quantity,
                    note: reason || notes,
                    created_at: new Date(),
                    created_by: (await supabase.auth.getUser()).data.user?.id
                }])
                return { data: true }
            } catch (error) {
                return { error: error.message }
            }
        },
        invalidatesTags: ['Inventory', 'InventoryAnalytics']
    }),

    updateMaterial: builder.mutation({
      queryFn: async ({ id, ...updates }) => {
        try {
          const { data, error } = await supabase.from('materials').update(updates).eq('id', id).select()
          if (error) throw error
          return { data: data[0] }
        } catch (error) {
          return { error: error.message }
        }
      },
      invalidatesTags: ['Inventory', 'InventoryAnalytics'],
    }),

    deleteMaterial: builder.mutation({
        queryFn: async (id) => {
            try {
                // Check if used in projects
                const { count } = await supabase.from('project_materials').select('*', { count: 'exact', head: true }).eq('material_id', id)
                if (count > 0) throw new Error("Cannot delete material: It is being used in projects.")

                const { error } = await supabase.from('materials').delete().eq('id', id)
                if (error) throw error
                return { data: id }
            } catch (error) {
                return { error: error.message }
            }
        },
        invalidatesTags: ['Inventory', 'InventoryAnalytics']
    })
  }),
})

export const { 
    useGetInventoryQuery, 
    useGetInventoryAnalyticsQuery,
    useGetProjectMaterialsQuery,
    useGetUsageTrendsQuery,
    useAddMaterialMutation, 
    useUpdateMaterialMutation, 
    useDeleteMaterialMutation,
    useAdjustStockMutation 
} = inventoryApi

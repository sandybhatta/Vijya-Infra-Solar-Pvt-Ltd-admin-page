import { supabase } from '@/lib/supabaseClient'
import { apiSlice } from '../api/apiSlice'

export const inventoryApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getInventory: builder.query({
       queryFn: async ({ page = 1, limit = 10, search = '', lowStock = false }) => {
        try {
          const from = (page - 1) * limit
          const to = from + limit - 1
          
          // Query inventory_stock (which has quantity) and join materials (which has name)
          let query = supabase
            .from('inventory_stock')
            .select('*, materials!inner(*)', { count: 'exact' }) // Inner join to filter by material name if needed
            .range(from, to)

          if (search) {
             // Filter by material name via the join
             query = query.ilike('materials.name', `%${search}%`)
          }
          
          if (lowStock) {
              query = query.lt('quantity_available', 10) 
          }

          const { data, error, count } = await query
          if (error) throw error
          
          // Flatten for UI if needed, or UI can handle nested
          // The UI expects 'name', 'quantity' (mapped to quantity_available), 'unit_cost'
          const flattened = data.map(item => ({
              ...item,
              name: item.materials?.name,
              sku: item.materials?.brand, // Assuming brand as SKU substitute or display
              quantity: item.quantity_available,
              unit_cost: item.materials?.unit_cost,
              id: item.material_id // Ensure generic ID actions work on material_id or stock id? 
              // UI delete probably wants material_id or stock_id. 
              // deleteMaterial mutation uses 'materials' table with 'id'.
              // So if we pass 'material_id' as 'id', delete works on material.
          }))

          return { data: { materials: flattened, total: count } }
        } catch (error) {
          return { error: error.message }
        }
      },
      providesTags: ['Inventory'],
    }),
    addMaterial: builder.mutation({
        queryFn: async ({ name, sku, unit, unit_cost, quantity }) => {
          try {
            // 1. Insert into materials
            const { data: mat, error: matError } = await supabase
                .from('materials')
                .insert([{ name, brand: sku, unit, unit_cost }]) // Mapping brand to sku for now
                .select()
                .single()
            
            if (matError) throw matError

            // 2. Insert into inventory_stock
            const { error: stockError } = await supabase
                .from('inventory_stock')
                .insert([{ material_id: mat.id, quantity_available: quantity || 0, warehouse_location: 'Main' }])
            
            if (stockError) throw stockError

            return { data: mat }
          } catch (error) {
            return { error: error.message }
          }
        },
        invalidatesTags: ['Inventory'],
      }),
    adjustStock: builder.mutation({
        queryFn: async ({ material_id, quantity, type, reason }) => {
            try {
                // Fetch current
                const { data: stock, error: fetchError } = await supabase.from('inventory_stock').eq('material_id', material_id).single()
                if (fetchError) throw new Error("Stock record not found")

                const newQty = type === 'in' ? stock.quantity_available + quantity : stock.quantity_available - quantity
                if (newQty < 0) throw new Error("Insufficient stock")

                // Update
                const { error: updateError } = await supabase.from('inventory_stock').update({ quantity_available: newQty }).eq('id', stock.id)
                if (updateError) throw updateError

                // Log
                await supabase.from('inventory_logs').insert([{
                    material_id,
                    change_type: type,
                    quantity,
                    reason,
                    created_at: new Date()
                }])
                return { data: true }
            } catch (error) {
                return { error: error.message }
            }
        },
        invalidatesTags: ['Inventory']
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
      invalidatesTags: ['Inventory'],
    }),
    deleteMaterial: builder.mutation({
        queryFn: async (id) => {
            try {
                const { error } = await supabase.from('materials').delete().eq('id', id)
                if (error) throw error
                return { data: id }
            } catch (error) {
                return { error: error.message }
            }
        },
        invalidatesTags: ['Inventory']
    })
  }),
})

export const { 
    useGetInventoryQuery, 
    useAddMaterialMutation, 
    useUpdateMaterialMutation, 
    useDeleteMaterialMutation,
    useAdjustStockMutation
} = inventoryApi

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'
import { useEffect } from 'react'

/**
 * Hook for Business Settings
 */
export const useBusinessSettings = () => {
    return useQuery({
        queryKey: ['business_settings'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('business_settings')
                .select('id, company_name, gst_number, address, contact_email, contact_phone, created_at')
                .maybeSingle()
            if (error) throw error
            return data || {}
        }
    })
}

export const useBusinessSettingsMutation = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async (settings) => {
            const { data: existing } = await supabase
                .from('business_settings')
                .select('id')
                .maybeSingle()
            
            let result
            if (existing) {
                result = await supabase
                    .from('business_settings')
                    .update(settings)
                    .eq('id', existing.id)
                    .select('id, company_name, gst_number, address, contact_email, contact_phone, created_at')
                    .single()
            } else {
                result = await supabase
                    .from('business_settings')
                    .insert([settings])
                    .select('id, company_name, gst_number, address, contact_email, contact_phone, created_at')
                    .single()
            }
            if (result.error) throw result.error
            return result.data
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['business_settings'] })
    })
}

/**
 * Hook for Admin Users
 */
export const useAdminUsers = () => {
    return useQuery({
        queryKey: ['admin_users'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('admin_users')
                .select('*')
                .order('created_at', { ascending: false })
            if (error) throw error
            return data
        }
    })
}

export const useAdminUserMutations = () => {
    const queryClient = useQueryClient()
    
    const createAdmin = useMutation({
        mutationFn: async (admin) => {
            const { data, error } = await supabase.from('admin_users').insert([admin]).select().single()
            if (error) throw error
            return data
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin_users'] })
    })

    const updateAdmin = useMutation({
        mutationFn: async ({ id, ...updates }) => {
            const { data, error } = await supabase.from('admin_users').update(updates).eq('id', id).select().single()
            if (error) throw error
            return data
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin_users'] })
    })

    const deleteAdmin = useMutation({
        mutationFn: async (id) => {
            const { error } = await supabase.from('admin_users').delete().eq('id', id)
            if (error) throw error
            return id
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin_users'] })
    })

    return { createAdmin, updateAdmin, deleteAdmin }
}

/**
 * Hook for Lead Sources
 */
export const useLeadSources = () => {
    return useQuery({
        queryKey: ['lead_sources_settings'],
        queryFn: async () => {
            // Get sources and join with IDs from leads table to count in JS
            const { data, error } = await supabase
                .from('lead_sources')
                .select(`
                    *,
                    leads:leads(id)
                `)
                .order('name')
            
            if (error) throw error
            
            return data.map(source => ({
                ...source,
                total_leads: source.leads?.length || 0
            }))
        }
    })
}

export const useLeadSourceMutations = () => {
    const queryClient = useQueryClient()
    
    const createSource = useMutation({
        mutationFn: async (source) => {
            const { data, error } = await supabase.from('lead_sources').insert([source]).select().single()
            if (error) throw error
            return data
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['lead_sources_settings'] })
    })

    const updateSource = useMutation({
        mutationFn: async ({ id, ...updates }) => {
            const { data, error } = await supabase.from('lead_sources').update(updates).eq('id', id).select().single()
            if (error) throw error
            return data
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['lead_sources_settings'] })
    })

    const deleteSource = useMutation({
        mutationFn: async (id) => {
            const { error } = await supabase.from('lead_sources').delete().eq('id', id)
            if (error) throw error
            return id
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['lead_sources_settings'] })
    })

    return { createSource, updateSource, deleteSource }
}

/**
 * Hook for Expense Categories
 */
export const useExpenseCategories = () => {
    return useQuery({
        queryKey: ['expense_categories_settings'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('expense_categories')
                .select(`
                    *,
                    expenses:expenses(amount)
                `)
                .order('name')
            
            if (error) throw error
            
            return data.map(cat => ({
                ...cat,
                total_expenses: cat.expenses?.length || 0,
                total_amount: cat.expenses?.reduce((sum, exp) => sum + (exp.amount || 0), 0) || 0
            }))
        }
    })
}

export const useExpenseCategoryMutations = () => {
    const queryClient = useQueryClient()
    
    const createCategory = useMutation({
        mutationFn: async (cat) => {
            const { data, error } = await supabase.from('expense_categories').insert([cat]).select().single()
            if (error) throw error
            return data
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['expense_categories_settings'] })
    })

    const updateCategory = useMutation({
        mutationFn: async ({ id, ...updates }) => {
            const { data, error } = await supabase.from('expense_categories').update(updates).eq('id', id).select().single()
            if (error) throw error
            return data
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['expense_categories_settings'] })
    })

    const deleteCategory = useMutation({
        mutationFn: async (id) => {
            const { error } = await supabase.from('expense_categories').delete().eq('id', id)
            if (error) throw error
            return id
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['expense_categories_settings'] })
    })

    return { createCategory, updateCategory, deleteCategory }
}

/**
 * Hook for Materials & Pricing
 */
export const useMaterialsSettings = () => {
    return useQuery({
        queryKey: ['materials_settings'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('materials')
                .select(`
                    *,
                    inventory_stock(quantity_available, reorder_level)
                `)
                .order('name')
            
            if (error) throw error
            return data
        }
    })
}

export const useMaterialMutations = () => {
    const queryClient = useQueryClient()
    
    const createMaterial = useMutation({
        mutationFn: async (material) => {
            const { data, error } = await supabase.from('materials').insert([material]).select().single()
            if (error) throw error
            
            // Also create inventory stock record
            await supabase.from('inventory_stock').insert([{
                material_id: data.id,
                quantity_available: 0,
                reorder_level: 10
            }])

            return data
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['materials_settings'] })
    })

    const updateMaterial = useMutation({
        mutationFn: async ({ id, ...updates }) => {
            const { data, error } = await supabase.from('materials').update(updates).eq('id', id).select().single()
            if (error) throw error
            return data
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['materials_settings'] })
    })

    const deleteMaterial = useMutation({
        mutationFn: async (id) => {
            const { error } = await supabase.from('materials').delete().eq('id', id)
            if (error) throw error
            return id
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['materials_settings'] })
    })

    const updateStock = useMutation({
        mutationFn: async ({ material_id, ...updates }) => {
            const { error } = await supabase.from('inventory_stock').update(updates).eq('material_id', material_id)
            if (error) throw error
            return material_id
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['materials_settings'] })
    })

    return { createMaterial, updateMaterial, deleteMaterial, updateStock }
}

/**
 * Hook for Marketing Campaigns
 */
export const useMarketingCampaigns = () => {
    return useQuery({
        queryKey: ['marketing_campaigns_settings'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('marketing_campaigns')
                .select(`
                    *,
                    leads:leads(status)
                `)
                .order('start_date', { ascending: false })
            
            if (error) throw error

            return data.map(camp => {
                const totalLeads = camp.leads?.length || 0
                const convertedLeads = camp.leads?.filter(l => l.status === 'converted').length || 0
                return {
                    ...camp,
                    total_leads: totalLeads,
                    converted_leads: convertedLeads,
                    conversion_rate: totalLeads > 0 ? (convertedLeads / totalLeads * 100).toFixed(1) : 0,
                    cpl: totalLeads > 0 ? (camp.budget / totalLeads).toFixed(2) : 0
                }
            })
        }
    })
}

export const useMarketingMutations = () => {
    const queryClient = useQueryClient()
    
    const createCampaign = useMutation({
        mutationFn: async (campaign) => {
            const { data, error } = await supabase.from('marketing_campaigns').insert([campaign]).select().single()
            if (error) throw error
            return data
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['marketing_campaigns_settings'] })
    })

    const updateCampaign = useMutation({
        mutationFn: async ({ id, ...updates }) => {
            const { data, error } = await supabase.from('marketing_campaigns').update(updates).eq('id', id).select().single()
            if (error) throw error
            return data
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['marketing_campaigns_settings'] })
    })

    const deleteCampaign = useMutation({
        mutationFn: async (id) => {
            const { error } = await supabase.from('marketing_campaigns').delete().eq('id', id)
            if (error) throw error
            return id
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['marketing_campaigns_settings'] })
    })

    return { createCampaign, updateCampaign, deleteCampaign }
}

/**
 * Real-time Subscription Hook for Settings
 */
export const useSettingsRealtime = () => {
    const queryClient = useQueryClient()

    useEffect(() => {
        const tables = [
            'business_settings', 
            'admin_users', 
            'lead_sources', 
            'expense_categories', 
            'materials', 
            'inventory_stock', 
            'marketing_campaigns'
        ]

        const subs = tables.map(table => {
            return supabase
                .channel(`${table}-settings-sync`)
                .on('postgres_changes', { event: '*', schema: 'public', table }, () => {
                    const queryKeyMap = {
                        'business_settings': ['business_settings'],
                        'admin_users': ['admin_users'],
                        'lead_sources': ['lead_sources_settings'],
                        'expense_categories': ['expense_categories_settings'],
                        'materials': ['materials_settings'],
                        'inventory_stock': ['materials_settings'],
                        'marketing_campaigns': ['marketing_campaigns_settings']
                    }
                    queryClient.invalidateQueries({ queryKey: queryKeyMap[table] })
                })
                .subscribe()
        })

        return () => {
            subs.forEach(sub => supabase.removeChannel(sub))
        }
    }, [queryClient])
}

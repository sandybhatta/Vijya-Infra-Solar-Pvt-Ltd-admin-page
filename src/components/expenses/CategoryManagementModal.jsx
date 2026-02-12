import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Edit, Trash2, Folder } from 'lucide-react'
import toast from 'react-hot-toast'
import {
  useGetExpenseCategoriesQuery,
  useCreateExpenseCategoryMutation,
  useUpdateExpenseCategoryMutation,
  useDeleteExpenseCategoryMutation
} from '@/features/finance/financeApi'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

export default function CategoryManagementModal({ open, setOpen }) {
  const [newCategoryName, setNewCategoryName] = useState('')
  const [editingCategory, setEditingCategory] = useState(null)
  const [editName, setEditName] = useState('')
  const [deleteCategory, setDeleteCategory] = useState(null)

  const { data: categories, isLoading } = useGetExpenseCategoriesQuery()
  const [createCategory, { isLoading: isCreating }] = useCreateExpenseCategoryMutation()
  const [updateCategory, { isLoading: isUpdating }] = useUpdateExpenseCategoryMutation()
  const [deleteCategoryMutation, { isLoading: isDeleting }] = useDeleteExpenseCategoryMutation()

  const handleCreate = async () => {
    if (!newCategoryName.trim()) {
      toast.error('Category name is required')
      return
    }

    try {
      await createCategory({ name: newCategoryName.trim() }).unwrap()
      toast.success('Category created successfully')
      setNewCategoryName('')
    } catch (error) {
      toast.error(error?.message || 'Failed to create category')
    }
  }

  const handleUpdate = async () => {
    if (!editName.trim()) {
      toast.error('Category name is required')
      return
    }

    try {
      await updateCategory({ id: editingCategory.id, name: editName.trim() }).unwrap()
      toast.success('Category updated successfully')
      setEditingCategory(null)
      setEditName('')
    } catch (error) {
      toast.error(error?.message || 'Failed to update category')
    }
  }

  const handleDelete = async () => {
    try {
      await deleteCategoryMutation(deleteCategory.id).unwrap()
      toast.success('Category deleted successfully')
      setDeleteCategory(null)
    } catch (error) {
      toast.error(error?.message || 'Failed to delete category')
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-gray-900 border-white/10 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl md:text-2xl font-black text-neon-blue">
              Manage Expense Categories
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Add New Category */}
            <div className="bg-white/5 border border-white/10 rounded-lg p-4">
              <h3 className="text-sm font-bold text-gray-400 uppercase mb-3">Add New Category</h3>
              <div className="flex gap-2">
                <Input
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="Category name..."
                  className="bg-white/5 border-white/10 text-white"
                  onKeyPress={(e) => e.key === 'Enter' && handleCreate()}
                />
                <Button
                  onClick={handleCreate}
                  disabled={isCreating}
                  className="bg-neon-blue hover:bg-neon-blue/80 text-black font-bold"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add
                </Button>
              </div>
            </div>

            {/* Existing Categories */}
            <div className="bg-white/5 border border-white/10 rounded-lg p-4">
              <h3 className="text-sm font-bold text-gray-400 uppercase mb-3">Existing Categories</h3>
              {isLoading ? (
                <div className="text-center text-gray-400 py-4">Loading categories...</div>
              ) : categories && categories.length > 0 ? (
                <div className="space-y-2">
                  {categories.map(category => (
                    <div
                      key={category.id}
                      className="flex items-center justify-between bg-white/5 border border-white/10 rounded-lg p-3"
                    >
                      {editingCategory?.id === category.id ? (
                        <div className="flex-1 flex gap-2">
                          <Input
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="bg-white/5 border-white/10 text-white"
                            onKeyPress={(e) => e.key === 'Enter' && handleUpdate()}
                          />
                          <Button
                            onClick={handleUpdate}
                            disabled={isUpdating}
                            size="sm"
                            className="bg-green-500 hover:bg-green-600 text-white"
                          >
                            Save
                          </Button>
                          <Button
                            onClick={() => {
                              setEditingCategory(null)
                              setEditName('')
                            }}
                            size="sm"
                            variant="outline"
                            className="bg-white/5 border-white/10 text-white hover:bg-white/10"
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-2">
                            <Folder className="h-4 w-4 text-purple-400" />
                            <span className="text-white font-medium">{category.name}</span>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              onClick={() => {
                                setEditingCategory(category)
                                setEditName(category.name)
                              }}
                              size="sm"
                              variant="ghost"
                              className="text-blue-400 hover:text-blue-300 hover:bg-white/5"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              onClick={() => setDeleteCategory(category)}
                              size="sm"
                              variant="ghost"
                              className="text-red-400 hover:text-red-300 hover:bg-white/5"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-400 py-4">No categories yet. Add one above!</div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteCategory} onOpenChange={() => setDeleteCategory(null)}>
        <AlertDialogContent className="bg-gray-900 border-white/10 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              This will permanently delete the category "{deleteCategory?.name}". This action cannot be undone.
              You cannot delete categories that are in use.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/5 border-white/10 text-white hover:bg-white/10">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

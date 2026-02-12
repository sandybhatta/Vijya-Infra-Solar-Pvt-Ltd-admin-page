import { useSelector } from 'react-redux'

export const RoleGuard = ({ children, allowedRoles = [], fallback = null }) => {
    const { role } = useSelector(state => state.auth)

    if (!role) return null

    // If allowedRoles is empty, allow everyone (or specifically require logic?)
    // Usually strict: if allowedRoles provided, must match.
    if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
        return fallback
    }

    return children
}

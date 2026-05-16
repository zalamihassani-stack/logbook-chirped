export default function AppCard({ as: Component = 'div', className = '', children, ...props }) {
  return (
    <Component
      className={`rounded-2xl border border-slate-100 bg-white shadow-sm ${className}`}
      {...props}
    >
      {children}
    </Component>
  )
}


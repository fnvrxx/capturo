export default function Card({ children, className = '', ...props }) {
  return (
    <div
      className={`bg-white border border-gray-200 rounded-xl p-[18px] ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

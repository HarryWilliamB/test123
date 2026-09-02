export function ItemIcon({ icon, size }: { icon: string | undefined; size: number }) {
  if (!icon) return <span className="item-icon empty" style={{ width: size, height: size }} />
  return (
    <img
      className="item-icon"
      src={`${import.meta.env.BASE_URL}icons/${icon.toLowerCase()}.png`}
      width={size}
      height={size}
      alt=""
      loading="lazy"
      draggable={false}
    />
  )
}

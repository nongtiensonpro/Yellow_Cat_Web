export const TypingAnimation = () => {
  return (
    <div className="flex gap-1 items-center">
      <div className="flex gap-1">
        <div className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
        <div className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
        <div className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce"></div>
      </div>
    </div>
  )
}

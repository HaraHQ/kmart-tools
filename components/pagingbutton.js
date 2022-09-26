const PagingButton = ({ text, action, todo, loading }) => {
  return (
    <div
      onClick={() => action(todo, loading)}
      className="text-2xl hover:bg-slate-600 w-full mx-2 h-full flex justify-center items-center cursor-pointer rounded-lg">
      {text}
    </div>
  )
}

export default PagingButton
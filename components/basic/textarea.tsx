import clsx from 'clsx'
import { forwardRef, TextareaHTMLAttributes } from 'react'

export default forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement> & { error?: boolean }
>(function TextInput(props, ref) {
  const { children, className, ...restProps } = props

  return (
    <textarea
      ref={ref}
      aria-invalid={props.error ? 'true' : 'false'}
      {...restProps}
      className={clsx(
        'block w-full rounded-md shadow-sm sm:text-sm',
        props.error
          ? 'border-red-300 text-red-900 placeholder-red-300 focus:border-red-500 focus:outline-none focus:ring-red-500'
          : 'max-w-lg border-gray-300 focus:border-indigo-500 focus:ring-indigo-500',
        className,
      )}
    />
  )
})

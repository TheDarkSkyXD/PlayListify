// Inspired by shadcn-ui/ui toast component
import * as React from "react"
import { X } from "lucide-react"

import { cn } from "../../lib/utils"

const TOAST_LIMIT = 5
const TOAST_REMOVE_DELAY = 3000

type ToastActionElement = React.ReactElement

export type Toast = {
  id: string
  title?: string
  description?: string
  action?: ToastActionElement
  variant?: "default" | "destructive" | "success"
  duration?: number
}

const actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
} as const

let count = 0

function genId() {
  count = (count + 1) % Number.MAX_VALUE
  return count.toString()
}

type ActionType = typeof actionTypes

type Action =
  | {
      type: ActionType["ADD_TOAST"]
      toast: Omit<Toast, "id">
    }
  | {
      type: ActionType["UPDATE_TOAST"]
      toast: Partial<Toast> & { id: string }
    }
  | {
      type: ActionType["DISMISS_TOAST"]
      toastId: string
    }
  | {
      type: ActionType["REMOVE_TOAST"]
      toastId: string
    }

interface State {
  toasts: Toast[]
}

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>()

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case actionTypes.ADD_TOAST:
      return {
        ...state,
        toasts: [
          ...state.toasts,
          { id: genId(), ...action.toast },
        ].slice(-TOAST_LIMIT),
      }

    case actionTypes.UPDATE_TOAST:
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t
        ),
      }

    case actionTypes.DISMISS_TOAST: {
      const { toastId } = action

      // Cancel any existing timeout
      if (toastTimeouts.has(toastId)) {
        clearTimeout(toastTimeouts.get(toastId))
        toastTimeouts.delete(toastId)
      }

      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === toastId ? { ...t, open: false } : t
        ),
      }
    }

    case actionTypes.REMOVE_TOAST:
      if (toastTimeouts.has(action.toastId)) {
        clearTimeout(toastTimeouts.get(action.toastId))
        toastTimeouts.delete(action.toastId)
      }

      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      }

    default:
      return state
  }
}

const listeners: Array<(state: State) => void> = []

let memoryState: State = { toasts: [] }

function dispatch(action: Action) {
  memoryState = reducer(memoryState, action)
  listeners.forEach((listener) => {
    listener(memoryState)
  })
}

type Toast2 = Omit<Toast, "id"> & { id?: string };

function toast(props: Toast2) {
  const id = genId()

  const update = (props: Toast2) =>
    dispatch({
      type: actionTypes.UPDATE_TOAST,
      toast: { ...props, id },
    })

  const dismiss = () => dispatch({ type: actionTypes.DISMISS_TOAST, toastId: id })

  dispatch({
    type: actionTypes.ADD_TOAST,
    toast: {
      ...props,
      id,
    } as Toast,
  })

  return {
    id,
    dismiss,
    update,
  }
}

function useToast() {
  const [state, setState] = React.useState<State>(memoryState)

  React.useEffect(() => {
    listeners.push(setState)
    return () => {
      const index = listeners.indexOf(setState)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }, [state])

  return {
    ...state,
    toast,
    dismiss: (toastId: string) => dispatch({ type: actionTypes.DISMISS_TOAST, toastId }),
  }
}

export { useToast, toast }

export interface ToastProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "destructive" | "success"
  onClose?: () => void
  onOpenChange?: (open: boolean) => void
}

export function Toast({
  className,
  variant = "default",
  onClose,
  onOpenChange,
  children,
  ...props
}: ToastProps) {
  return (
    <div
      className={cn(
        "relative pointer-events-auto flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-4 shadow-lg transition-all",
        variant === "default" && "bg-background border",
        variant === "destructive" && "destructive group border-destructive bg-destructive text-destructive-foreground",
        variant === "success" && "bg-green-500/10 border-green-500/20 text-green-700",
        className
      )}
      {...props}
    >
      <div className="flex-1">{children}</div>
      {onClose && (
        <button
          onClick={() => {
            onClose();
            onOpenChange?.(false);
          }}
          className={cn(
            "rounded-md p-1",
            variant === "default" && "text-muted-foreground hover:bg-secondary",
            variant === "destructive" && "text-destructive-foreground/80 hover:text-destructive-foreground hover:bg-destructive-foreground/20"
          )}
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}

export interface ToastTitleProps extends React.HTMLAttributes<HTMLDivElement> {}

export function ToastTitle({ className, ...props }: ToastTitleProps) {
  return <div className={cn("text-sm font-semibold", className)} {...props} />
}

export interface ToastDescriptionProps extends React.HTMLAttributes<HTMLDivElement> {}

export function ToastDescription({ className, ...props }: ToastDescriptionProps) {
  return <div className={cn("text-sm opacity-90", className)} {...props} />
}

export function Toaster() {
  const { toasts } = useToast()

  return (
    <div className="fixed bottom-4 left-4 z-50 flex flex-col gap-2 w-full max-w-md">
      {toasts.map(({ id, title, description, variant, action, ...props }) => (
        <Toast
          key={id}
          variant={variant}
          {...props}
          onClose={() => dispatch({ type: actionTypes.DISMISS_TOAST, toastId: id })}
        >
          <div className="grid gap-1">
            {title && <ToastTitle>{title}</ToastTitle>}
            {description && <ToastDescription>{description}</ToastDescription>}
          </div>
          {action}
        </Toast>
      ))}
    </div>
  )
} 
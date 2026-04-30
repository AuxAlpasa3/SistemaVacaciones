import { Bounce, toast, type Theme, type ToastPosition, type TypeOptions } from "react-toastify";

export const showToast = ({ theme = 'light', position = 'top-center', type = 'success', text = 'string', closeOnClick = true, autoClose = 3000 }: { theme?: Theme, position?: ToastPosition, type: TypeOptions, text: string, closeOnClick?: boolean, autoClose?: number }) => {
    toast(text, {
        type,
        position,
        autoClose,
        hideProgressBar: false,
        closeOnClick,
        pauseOnHover: false,
        pauseOnFocusLoss: false,
        draggable: false,
        progress: undefined,
        theme,
        transition: Bounce,
    });
}
import { EyeIcon, EyeOffIcon } from "lucide-react"
import { useState, type InputHTMLAttributes, type ReactNode } from "react"

type PasswordInputProps=Omit<InputHTMLAttributes<HTMLInputElement>,"type"> & {
    leadingIcon?:ReactNode
}

export default function PasswordInput({className="",leadingIcon,onFocus,autoComplete="new-password",...props}:PasswordInputProps){
    const [visible,setVisible]=useState(false)
    const [editable,setEditable]=useState(false)
    return <div className="relative">
        {leadingIcon && (
            <span className="absolute left-3.5 top-1/2 z-10 -translate-y-1/2 text-app-text-light pointer-events-none">
                {leadingIcon}
            </span>
        )}
        <input
            {...props}
            type={visible ? "text" : "password"}
            className={`${className} ${leadingIcon ? "pl-11" : ""} pr-11`}
            autoComplete={autoComplete}
            readOnly={!editable}
            onFocus={event=>{setEditable(true);onFocus?.(event)}}
            data-lpignore="true"
            data-1p-ignore="true"
            data-bwignore="true"
        />
        <button
            type="button"
            onClick={()=>setVisible(current=>!current)}
            className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-md p-1 text-app-text-light hover:text-app-green focus-visible:outline-2 focus-visible:outline-app-green"
            aria-label={visible ? "Hide password" : "Show password"}
            aria-pressed={visible}
        >
            {visible ? <EyeOffIcon className="size-4"/> : <EyeIcon className="size-4"/>}
        </button>
    </div>
}

import { Component, type ErrorInfo, type ReactNode } from "react"
import { removeStoredValue } from "../utils/storage"

interface Props {
    children: ReactNode
}

interface State {
    hasError: boolean
}

export default class AppErrorBoundary extends Component<Props, State> {
    state: State = { hasError: false }

    static getDerivedStateFromError(): State {
        return { hasError: true }
    }

    componentDidCatch(error: Error, info: ErrorInfo) {
        console.error("Application render failed", error, info)
    }

    private recover = () => {
        removeStoredValue("app_cart", "auth_user", "auth_token", "delivery_partner", "delivery_token")
        window.location.assign("/")
    }

    render() {
        if (!this.state.hasError) return this.props.children

        return (
            <main className="min-h-screen bg-app-cream flex items-center justify-center px-4">
                <section className="w-full max-w-md bg-white border border-app-border rounded-2xl p-8 text-center shadow-sm">
                    <h1 className="text-xl font-semibold text-app-green">Something went wrong</h1>
                    <p className="mt-2 text-sm text-app-text-light">
                        The app could not load saved browser data correctly.
                    </p>
                    <button
                        type="button"
                        onClick={this.recover}
                        className="mt-6 px-5 py-2.5 bg-app-green text-white text-sm font-semibold rounded-xl"
                    >
                        Reset and reload
                    </button>
                </section>
            </main>
        )
    }
}

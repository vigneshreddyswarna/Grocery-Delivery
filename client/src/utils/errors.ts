export const getErrorMessage=(error:unknown,fallback="Something went wrong")=>{
    if(typeof error === "object" && error !== null && "response" in error){
        const response=(error as {response?:{data?:{message?:unknown}}}).response
        if(typeof response?.data?.message === "string") return response.data.message
    }
    if(error instanceof Error && error.message) return error.message
    return fallback
}

import { Link, useNavigate, useParams } from "react-router-dom"
import { useCart } from "../context/CartContext"
import { useEffect, useState } from "react"
import type { Product } from "../types"
import Loading from "../components/Loading"
import { AlertCircleIcon, ArrowLeftIcon, ArrowRightIcon, HomeIcon, LeafIcon, MinusIcon, PlusIcon, ShoppingCartIcon, StarIcon } from "lucide-react"
import DummyReviewsSection from "../assets/DummyReviewsSection"
import ProductCard from "../components/ProductCard"
import api from "../config/api"
import { getProductId, normalizeProduct, normalizeProducts } from "../utils/product"

const ProductPage = () => {
  const currency = import.meta.env.VITE_CURRENCY_SYMBOL || "₹"
  const { id } = useParams()
  const navigate = useNavigate()
  const { items, addToCart, updateQuantity, removeFromCart } = useCart()

  const [product, setProduct] = useState<Product | null>(null)
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [localQuantity, setLocalQuantity] = useState(1)

  useEffect(() => {
    setLoading(true)
    setLoadError(false)
    setLocalQuantity(1)
    window.scrollTo(0, 0)
    
    // Fixed: Accounted for typical axios `.data` wrapping structures cleanly
    api.get(`/products/${id}`)
      .then((res: any) => {
        const productData = normalizeProduct(res.data?.product || res.product || res.data || {})
        setProduct(productData)
        return api.get(`/products?category=${encodeURIComponent(productData.category)}`)
      })
      .then((res: any) => {
        const productsList = normalizeProducts(res.data?.products || res.products || res.data)
        // Adjusted comparison matcher to fallback gracefully regardless of if payload uses ._id or .id
        setRelatedProducts(productsList.filter((p: Product) => getProductId(p) !== id))
      })
      .catch(() => setLoadError(true))
      .finally(() => setLoading(false))
  }, [id, navigate])

  if (loading) return <Loading />
  if (loadError || !product) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center">
        <AlertCircleIcon className="size-10 text-app-orange" />
        <h1 className="mt-4 text-xl font-semibold text-app-green">Product unavailable</h1>
        <p className="mt-2 text-sm text-app-text-light">This product could not be loaded. It may have been removed.</p>
        <button type="button" onClick={() => navigate("/products")} className="mt-5 px-5 py-2.5 bg-app-green text-white text-sm font-semibold rounded-lg">
          Browse products
        </button>
      </div>
    )
  }

  // Added dynamic evaluation fallback check supporting both database schema patterns (_id vs id)
  const activeProductId = getProductId(product)
  const cartItem = items.find((item) => getProductId(item.product) === activeProductId)
  const inCart = !!cartItem;
  const displayQuantity = inCart ? cartItem.quantity : localQuantity

  const handleMinus = () => {
    if (inCart) {
      if (cartItem.quantity > 1) updateQuantity(activeProductId, cartItem.quantity - 1)
      else removeFromCart(activeProductId)
    } else {
      setLocalQuantity(Math.max(1, localQuantity - 1))
    }
  }

  const handlePlus = () => {
    if (inCart) updateQuantity(activeProductId, cartItem.quantity + 1)
    else setLocalQuantity(localQuantity + 1)
  }

  const categoryLabel = product.category.replace(/-/g, " ");

  return (
    <div className="min-h-screen bg-app-cream/30 text-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-app-text-light mb-6">
          <Link to='/' className="hover:text-app-green transition-colors">
            <HomeIcon className="size-4" />
          </Link>
          <span>/</span>
          <Link to='/products' className="hover:text-app-green transition-colors">
            Products
          </Link>
          <span>/</span>
          <Link to={`/products?category=${product.category}`} className="hover:text-app-green transition-colors capitalize">
            {categoryLabel}
          </Link>
          <span>/</span>
          <span className="text-app-green font-medium truncate max-w-[200px]">{product.name}</span>
        </nav>

        {/* Back button */}
        <button onClick={() => navigate(-1)} className="mb-6 inline-flex items-center gap-1.5 text-sm text-app-text-light hover:text-app-green transition-colors">
          <ArrowLeftIcon className="size-4"/> Back
        </button>

        {/* Product Details Section Card wrapper container layout */}
        <div className="bg-white rounded-2xl border border-black/5 shadow-xs overflow-hidden mb-12">
          <div className="grid grid-cols-1 md:grid-cols-2">
            
            {/* Left Side Column - Image & Badges */}
            <div className="relative flex items-center justify-center p-8 md:p-12 bg-gray-50/50 border-b md:border-b-0 md:border-r border-gray-100 min-h-[320px] md:min-h-[480px]">
              <img src={product.image} alt={product.name} className="max-h-[360px] w-auto object-contain mix-blend-multiply" />

              <div className="absolute top-5 left-5 flex flex-wrap gap-1.5 z-10">
                {product.isOrganic && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-app-green text-white rounded-full shadow-xs">
                    <LeafIcon className="w-3 h-3"/>Organic
                  </span>
                )}
                {product.discount > 0 && (
                  <span className="px-2.5 py-1 text-xs font-semibold bg-orange-500 text-white rounded-full shadow-xs">
                    {product.discount}% OFF
                  </span>
                )}
              </div>
            </div> {/* Fixed: Balanced the missing structural closing tag container element correctly */}

            {/* Right Side Column - Text Details content workspace summary */}
            <div className="p-6 md:p-10 flex flex-col justify-center">
              <span className="text-xs font-semibold text-app-text-light tracking-wider mb-2 uppercase">{categoryLabel}</span>
              <h1 className="text-2xl md:text-3xl font-bold text-app-green mb-3">{product.name}</h1>

              {/* Rating Component Row */}
              {product.rating > 0 && (
                <div className="flex items-center gap-2 mb-5">
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <StarIcon 
                        key={star} 
                        className={`w-4 h-4 ${star <= Math.round(product.rating) ? "text-amber-400 fill-amber-400" : "text-gray-200"}`}
                      />
                    ))}
                  </div>
                  <span className="text-sm font-semibold text-gray-700">{product.rating}</span>
                  <span className="text-sm text-app-text-light">({product.reviewCount} reviews)</span>
                </div>
              )}

              {/* Pricing metrics layout component row */}
              <div className="flex items-baseline gap-3 mb-5">
                <span className="text-3xl font-bold text-app-green">{currency}{product.price.toFixed(2)}</span>
                {product.originalPrice > product.price && (
                  <span className="text-md text-app-text-light line-through font-medium">{currency}{product.originalPrice.toFixed(2)}</span>
                )}
              </div>

              {/* Text Description Segment content body layout section */}
              <p className="text-sm text-gray-600 leading-relaxed mb-6">{product.description}</p>

              {/* Stock inventory marker component validation loop */}
              <div className="mb-6">
                {product.stock > 0 ? (
                  <span className="inline-flex items-center text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md">
                    ✔ In Stock ({product.stock} available)
                  </span>
                ) : (
                  <span className="inline-flex items-center text-xs font-semibold text-red-600 bg-red-50 px-2.5 py-1 rounded-md">
                    Out of Stock
                  </span>
                )}
              </div>

              {/* Action Stepper quantity modifications and additions section context items footer column */}
              <div className="flex flex-wrap items-center gap-3">
                
                {/* Quantity adjustments row stepper layout wrapper buttons group */}
                <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden bg-white shadow-xs">
                  <button onClick={handleMinus} className="p-3 hover:bg-gray-50 active:bg-gray-100 text-gray-500 transition-colors">
                    <MinusIcon className="w-4 h-4" />
                  </button>
                  <span className="px-4 text-sm font-bold min-w-[36px] text-center text-gray-800">{displayQuantity}</span>
                  <button onClick={handlePlus} className="p-3 hover:bg-gray-50 active:bg-gray-100 text-gray-500 transition-colors">
                    <PlusIcon className="w-4 h-4" />
                  </button>
                </div>

                {/* Main operational add target execution click trigger button widget */}
                <button 
                  onClick={() => { if (!inCart) addToCart(product, localQuantity) }} 
                  disabled={product.stock === 0} 
                  className={`flex-1 min-w-[160px] py-3 px-6 font-semibold rounded-xl text-sm transition-all duration-200 inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-xs active:scale-[0.99] ${
                    inCart 
                      ? "bg-emerald-50 text-app-green border border-emerald-200" 
                      : "bg-orange-500 text-white hover:bg-orange-600"
                  }`}
                >
                  <ShoppingCartIcon className="w-4 h-4" />
                  <span>{inCart ? "Added to Cart" : "Add to Cart"}</span>
                </button>

              </div>

            </div>

          </div>
        </div>

        {/* Customer Product Assessment Reviews Section */}
        {product.reviewCount > 0 && <DummyReviewsSection product={product} />}

        {/* Related Category Alternative recommendations Section products carousel fallback grid items */}
        {relatedProducts.length > 0 && (
          <section className="mt-16 mb-24">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-app-green">Related Products</h2>
                <p className="text-xs text-app-text-light mt-0.5">More options from {categoryLabel}</p>
              </div>
              <Link 
                className="text-xs font-bold text-orange-500 hover:text-orange-600 inline-flex items-center gap-0.5 transition-colors" 
                to={`/products?category=${encodeURIComponent(product.category)}`}
              >
                <span>View All</span> <ArrowRightIcon className="size-3.5" />
              </Link>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 xl:gap-6">
              {relatedProducts.slice(0, 5).map((rp) => (
                <ProductCard key={getProductId(rp)} product={rp} />
              ))}
            </div>
          </section>
        )}

      </div>
    </div>
  )
}

export default ProductPage

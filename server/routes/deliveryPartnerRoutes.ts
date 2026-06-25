import express from 'express'
import { cancelDelivery, completeDelivery, getCurrentPartner, getDeliveryDetail, getMyDeliveries, loginPartner, updateDeliveryStatus, updateLocation } from '../controllers/deliveryPartnerController.js'
import deliveryAuth from '../middleware/deiveryAuth.js'

const deliveryPartnerRouter=express.Router()

deliveryPartnerRouter.post('/login',loginPartner)
deliveryPartnerRouter.get('/me', deliveryAuth, getCurrentPartner)

const deliveryRoutes = ['/my-deliveries', '/my-delieveries']

deliveryRoutes.forEach((route) => {
    deliveryPartnerRouter.get(route, deliveryAuth, getMyDeliveries)
    deliveryPartnerRouter.get(`${route}/:id`, deliveryAuth, getDeliveryDetail)
    deliveryPartnerRouter.put(`${route}/:id/complete`, deliveryAuth, completeDelivery)
    deliveryPartnerRouter.put(`${route}/:id/cancel`, deliveryAuth, cancelDelivery)
    deliveryPartnerRouter.put(`${route}/:id/status`, deliveryAuth, updateDeliveryStatus)
    deliveryPartnerRouter.put(`${route}/:id/location`, deliveryAuth, updateLocation)
})

export default deliveryPartnerRouter

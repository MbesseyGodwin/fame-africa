import { Router } from 'express'
import * as SponsorsController from './sponsors.controller'

export const sponsorsRouter = Router()

sponsorsRouter.get('/cycle/:cycleId', SponsorsController.getCycleSponsors)
sponsorsRouter.get('/next-ad', SponsorsController.getNextAd)
sponsorsRouter.post('/track-impression', SponsorsController.trackAdClick)
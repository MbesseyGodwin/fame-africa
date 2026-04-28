// services/api/src/modules/battles/battles.routes.ts

import { Router } from 'express'
import * as BattlesController from './battles.controller'

export const battlesRouter = Router()

battlesRouter.get('/active', BattlesController.getActiveBattles)
battlesRouter.get('/past', BattlesController.getPastBattles)
battlesRouter.post('/:battleId/otp', BattlesController.requestBattleOtp)
battlesRouter.post('/:battleId/vote', BattlesController.castBattleVote)

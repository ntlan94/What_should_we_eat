/**
 * ============================================================================
 * Project: What Should We Eat?
 * File: backend/src/routes/rooms.js
 * Description: Express routes for creating rooms, fetching state, joining, and
 *              recording swipes.
 * Author: Thanh Lan Ngo
 * Collaborators: Jovian Niko Soesilo
 * Date Created: 2026-11-17
 * Last Modified: 2026-11-21
 * Modified by: Thanh Lan Ngo
 * ============================================================================
 */

import { Router } from 'express';
import {
  createRoomHandler,
  getRoomHandler,
  joinRoomHandler,
} from '../controllers/roomController.js';
import { swipeHandler } from '../controllers/swipeController.js';

const router = Router();

router.post('/', createRoomHandler);
router.get('/:code', getRoomHandler);
router.post('/:code/join', joinRoomHandler);
router.post('/:code/swipes', swipeHandler);

export default router;
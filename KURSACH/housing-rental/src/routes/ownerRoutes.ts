import express from 'express';
import { getOwnerStatistics } from '../controllers/ownerController';

const router = express.Router();

router.get('/statistics/:userId', getOwnerStatistics);

export default router;

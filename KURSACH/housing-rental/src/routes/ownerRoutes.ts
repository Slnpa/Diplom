import express from 'express';
import { bookForExternalUser, getOwnerStatistics } from '../controllers/ownerController';

const router = express.Router();

router.get('/statistics/:userId', getOwnerStatistics);

router.post('/book-external', bookForExternalUser);

export default router;

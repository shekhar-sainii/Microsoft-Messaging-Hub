import { Router } from 'express';
import { favouriteController } from './favourite.controller';
import { authMiddleware } from '../../auth/authMiddleware';

const router = Router();

router.use(authMiddleware);

router.get('/', favouriteController.getFavourites);
router.post('/', favouriteController.addFavourite);
router.delete('/:channelId', favouriteController.removeFavourite);

export default router;

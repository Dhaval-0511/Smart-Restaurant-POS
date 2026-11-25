import express from 'express';
import { getSummary } from '../controllers/reports.controller.js';

const router = express.Router();

router.get('/summary', getSummary);

export default router;

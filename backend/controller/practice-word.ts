import { Router, Request, Response } from 'express';
import { Practice } from '../models/practice-word.model';
import { authenticateToken } from '../midlewere/auth.midlewere';

const router = Router();

// GET /api/practice/:groupId - Group bo'yicha practiceni olish (har bir groupda bitta practice)
router.get('/:groupId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { groupId } = req.params;
    const userId = (req as any).user.userId;
    console.log(userId, groupId);

    const practice = await Practice.findOne({ userId, groupId });
    console.log(practice);
    if (!practice) {
      return res.status(404).json({ success: false, message: 'Practice not found' });
    }

    res.json({ success: true, data: practice });
  } catch (error) {
    console.error('Error fetching practice:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch practice' });
  }
});

// POST /api/practice - Yangi practice yaratish yoki yangilash
router.post('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { groupId, questions } = req.body;
    const userId = (req as any).user.userId;

    if (!groupId) {
      return res.status(400).json({ success: false, message: 'GroupId is required' });
    }

    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ success: false, message: 'Questions array is required and cannot be empty' });
    }

    let practice = await Practice.findOne({ userId, groupId });

    if (practice) {
      practice.questions = questions;
      practice.totalQuestions = questions.length;
      practice.lastPracticed = new Date();
      await practice.save();
      
      res.json({ 
        success: true, 
        data: practice,
        message: 'Practice updated successfully' 
      });
    } else {
      const newPractice = new Practice({
        userId,
        groupId,
        questions,
        totalQuestions: questions.length,
        lastPracticed: new Date()
      });
      await newPractice.save();
      
      res.json({ 
        success: true, 
        data: newPractice,
        message: 'Practice created successfully' 
      });
    }
  } catch (error) {
    console.error('Error saving practice:', error);
    res.status(500).json({ success: false, message: 'Failed to save practice' });
  }
});

// PUT /api/practice/:groupId/result - Practice natijasini yangilash
router.put('/:groupId/result', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { groupId } = req.params;
    const { score, totalQuestions } = req.body;
    const userId = (req as any).user.userId;

    const practice = await Practice.findOne({ userId, groupId });
    
    if (!practice) {
      return res.status(404).json({ success: false, message: 'Practice not found' });
    }
    
    practice.lastPracticed = new Date();
    await practice.save();

    res.json({ 
      success: true, 
      data: practice,
      message: 'Practice result updated successfully' 
    });
  } catch (error) {
    console.error('Error updating practice result:', error);
    res.status(500).json({ success: false, message: 'Failed to update practice result' });
  }
});

// DELETE /api/practice/:groupId - Practiceni o'chirish
router.delete('/:groupId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { groupId } = req.params;
    const userId = (req as any).user.userId;

    const result = await Practice.deleteOne({ userId, groupId });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, message: 'Practice not found' });
    }

    res.json({ success: true, message: 'Practice deleted successfully' });
  } catch (error) {
    console.error('Error deleting practice:', error);
    res.status(500).json({ success: false, message: 'Failed to delete practice' });
  }
});

export default router;
import express from 'express';
import { PrismaClient } from '../generated/prisma';
import cors from 'cors';

const app = express();
const prisma = new PrismaClient();
app.use(express.json());
app.use(cors());

app.post('/join', async (req, res) => {
  res.status(200).json({ message: "User joined" });
});

app.post('/exit', async (req, res) => {
  res.status(200).json({ message: "User exited" });
});

app.post('/messages', async (req, res) => {
  const { room, name, message } = req.body;
  await prisma.message.create({ data: { room, name, message } });
  res.status(201).json({ message: "Message saved" });
});

app.get('/rooms/:room/messages', async (req, res) => {
  const messages = await prisma.message.findMany({
    where: { room: req.params.room },
    orderBy: { timestamp: 'asc' },
  });
  res.status(200).json(messages);
});

app.listen(4000, () => console.log("API running on port 4000"));

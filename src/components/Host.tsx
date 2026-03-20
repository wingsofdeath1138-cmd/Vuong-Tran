import React, { useState, useEffect, useRef } from 'react';
import socket from '../socket';
import { QRCodeSVG } from 'qrcode.react';
import { GameConfig, GameState, Item, PlayerState, Question, QuestionSet, GameMode } from '../types';
import { Trophy, Clock, Users, Play, Settings, RotateCcw, Copy, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const ITEM_TYPES = {
  gold_small: { points: 10, weight: 1.2, radius: 15, color: '#FFD700' },
  gold_medium: { points: 20, weight: 1.8, radius: 25, color: '#FFD700' },
  gold_large: { points: 30, weight: 3.0, radius: 40, color: '#FFD700' },
  diamond: { points: 50, weight: 1.0, radius: 12, color: '#00FFFF' },
  stone: { points: 5, weight: 5.0, radius: 30, color: '#808080' },
  mine: { points: -20, weight: 1.0, radius: 20, color: '#000000' },
  mole: { points: 5, weight: 1.2, radius: 15, color: '#8B4513' },
  trash: { points: 0, weight: 4.0, radius: 20, color: '#A9A9A9' },
};

const Host: React.FC = () => {
  const [roomId, setRoomId] = useState<string | null>(null);
  const [gameState, setGameState] = useState<GameState>('waiting');
  const [players, setPlayers] = useState<PlayerState[]>([]);
  const [timeLeft, setTimeLeft] = useState(60);
  const [items, setItems] = useState<Item[]>([]);
  const [questionSets, setQuestionSets] = useState<QuestionSet[]>([
    {
      id: 'set1',
      name: 'Bộ câu hỏi 1',
      questions: [
        { id: 'q1', text: "Have a positive impact on + noun", options: ["Có tác động tiêu cực lên", "Không có tác động lên", "Có tác động tích cực lên", "Là nguyên nhân của"], correctAnswer: 2 },
        { id: 'q2', text: "The new policy is expected to ______ the local economy by creating more jobs.", options: ["have a negative impact on", "have a positive impact on", "cause misunderstanding for", "bridge the gap with"], correctAnswer: 1 },
        { id: 'q3', text: "Excessive use of social media can ______ teenagers' mental health and sleep patterns.", options: ["have a positive impact on", "build relationships with", "have a negative impact on", "keep in touch with"], correctAnswer: 2 },
        { id: 'q4', text: "Face-to-face communication", options: ["Giao tiếp qua điện thoại", "Giao tiếp trực tiếp", "Giao tiếp qua email", "Giao tiếp qua mạng xã hội"], correctAnswer: 1 },
        { id: 'q5', text: "While online messaging is convenient, nothing can replace ______ for building deep trust.", options: ["foreign language", "face-to-face communication", "relaxing", "time-consuming"], correctAnswer: 1 },
        { id: 'q6', text: "Many people prefer ______ because they can see the other person's expressions and body language.", options: ["face-to-face communication", "spending time on screens", "widening the gap", "finding a good job"], correctAnswer: 0 },
        { id: 'q7', text: "Keep in touch with + noun", options: ["Mất liên lạc với ai đó", "Giữ liên lạc với ai đó", "Cắt đứt quan hệ với ai đó", "Gặp gỡ ai đó"], correctAnswer: 1 },
        { id: 'q8', text: "Social media helps us ______ friends who live far away.", options: ["widen the gap with", "keep in touch with", "have a negative impact on", "rely on"], correctAnswer: 1 },
        { id: 'q9', text: "I try to ______ my childhood friends by calling them at least once a month.", options: ["build relationships with", "keep in touch with", "cause misunderstanding for", "spend time on"], correctAnswer: 1 },
        { id: 'q10', text: "Spend time on", options: ["Tiết kiệm thời gian", "Dành thời gian cho thiết bị điện tử", "Lãng phí thời gian", "Sắp xếp thời gian biểu"], correctAnswer: 1 },
        { id: 'q11', text: "Children today ______ too much time ______ their phones, playing games or watching videos.", options: ["spend / on", "rely / on", "keep / in touch with", "build / on"], correctAnswer: 0 },
        { id: 'q12', text: "Doctors warn that ______ too much time ______ electronic devices can cause eye strain.", options: ["building / on", "relying / in", "spending / on", "causing / on"], correctAnswer: 2 },
        { id: 'q13', text: "Build relationships", options: ["Phá vỡ mối quan hệ với đồng nghiệp", "Xây dựng các mối quan hệ với đồng nghiệp", "Tránh gặp đồng nghiệp", "Phụ thuộc vào đồng nghiệp"], correctAnswer: 1 },
        { id: 'q14', text: "Teamwork is a great way to ______ strong ______ your coworkers.", options: ["spend / on", "keep / in touch with", "build / relationships with", "widen / the gap with"], correctAnswer: 2 },
        { id: 'q15', text: "Trust and honesty are essential if you want to ______ lasting ______ your partners.", options: ["cause / misunderstanding", "find / a good job", "build / relationships with", "rely / on"], correctAnswer: 2 },
        { id: 'q16', text: "Rely on + noun", options: ["Phản đối", "Độc lập", "Phụ thuộc, dựa vào", "Lờ đi"], correctAnswer: 2 },
        { id: 'q17', text: "In modern life, we often ______ technology for almost everything, from communication to navigation.", options: ["cause", "spend on", "rely on", "build"], correctAnswer: 2 },
        { id: 'q18', text: "You shouldn't ______ public transport too much if you live in the countryside; it might not be very frequent.", options: ["rely on", "build relationships with", "keep in touch with", "widen"], correctAnswer: 0 },
        { id: 'q19', text: "Real life", options: ["Cuộc sống hàng ngày", "Thế giới ảo", "Gia đình", "Công việc"], correctAnswer: 1 },
        { id: 'q20', text: "Some people prefer online games to ______ because they can be anyone they want.", options: ["relaxing", "real life", "versatile", "peaceful"], correctAnswer: 1 },
        { id: 'q21', text: "It's important to balance your online activities with ______ to maintain healthy social skills.", options: ["reliable", "rewarding", "real life", "spacious"], correctAnswer: 2 },
        { id: 'q22', text: "Cause misunderstanding", options: ["Giải thích rõ ràng", "Gây ra sự hiểu lầm", "Tháo gỡ khúc mắc", "Đồng ý với ai"], correctAnswer: 1 },
        { id: 'q23', text: "Text messages can easily ______ because we cannot hear the person's tone of voice.", options: ["build relationships", "rely on", "cause misunderstanding", "keep in touch"], correctAnswer: 2 },
        { id: 'q24', text: "Lack of ______ communication can often ______ between friends and family.", options: ["real life / bridge the gap", "face-to-face / cause misunderstanding", "foreign / build relationships", "sentimental / rely on"], correctAnswer: 1 },
        { id: 'q25', text: "Bridge/widen the gap", options: ["Làm giàu khoảng cách giàu nghèo", "Thu hẹp khoảng cách giàu nghèo", "Xóa bỏ người giàu và người nghèo", "Tạo ra khoảng cách giàu nghèo"], correctAnswer: 1 },
        { id: 'q26', text: "Learning a common language can help ______ the cultural ______ between different countries.", options: ["bridge / gap", "widen / gap", "spend / time", "cause / misunderstanding"], correctAnswer: 0 },
        { id: 'q27', text: "Misusing social media can actually ______ the ______ between generations instead of bringing them together.", options: ["bridge / gap", "spend / time", "cause / misunderstanding", "widen / gap"], correctAnswer: 3 },
        { id: 'q28', text: "learn a foreign language", options: ["Học tiếng mẹ đẻ", "Học ngoại ngữ", "Dạy tiếng Việt", "Học văn hóa"], correctAnswer: 1 },
        { id: 'q29', text: "If you want to work for an international company, you should ______.", options: ["find a good job", "learn a foreign language", "spend time on screens", "face more academic pressure"], correctAnswer: 1 },
        { id: 'q30', text: "Many people use apps like Duolingo to ______ in their free time.", options: ["relax", "build relationships", "learn a foreign language", "cause misunderstanding"], correctAnswer: 2 },
        { id: 'q31', text: "communicate with foreigners", options: ["Trao đổi thông tin, trò chuyện với người nước ngoài", "Học cách viết sách", "Dịch tài liệu", "Làm bài tập về nhà"], correctAnswer: 0 },
        { id: 'q32', text: "The best way to practice speaking is to find opportunities to ______.", options: ["find a good job", "learn a foreign language", "communicate with foreigners", "face academic pressure"], correctAnswer: 2 },
        { id: 'q33', text: "Knowing English well allows you to confidently ______ from all over the world.", options: ["build relationships", "communicate with foreigners", "rely on foreigners", "spend time on"], correctAnswer: 1 },
        { id: 'q34', text: "find a good job", options: ["Nghỉ việc", "Tìm việc làm tốt", "Phỏng vấn xin việc", "Mất việc"], correctAnswer: 1 },
        { id: 'q35', text: "A university degree can help you ______ more easily.", options: ["find a good job", "spend time on screens", "cause misunderstanding", "rely on parents"], correctAnswer: 0 },
        { id: 'q36', text: "Having relevant work experience is crucial if you want to ______ after graduation.", options: ["learn a foreign language", "find a good job", "bridge the gap", "keep in touch"], correctAnswer: 1 },
        { id: 'q37', text: "Have more chances to study abroad", options: ["Học sinh giàu có ít cơ hội du học", "Học sinh giàu có có nhiều cơ hội du học hơn", "Học sinh giàu có thích đi du lịch", "Học sinh giàu không muốn đi học"], correctAnswer: 1 },
        { id: 'q38', text: "If you get a scholarship, you will ______.", options: ["find a good job", "have more chances to study abroad", "spend more time on phones", "widen the gap"], correctAnswer: 1 },
        { id: 'q39', text: "Excellent academic results can help students ______ and experience new cultures.", options: ["have more chances to study abroad", "cause misunderstanding", "rely on teachers", "face academic pressure"], correctAnswer: 0 },
        { id: 'q40', text: "Gain/give an academic advantage", options: ["Bị thua thiệt trong học tập", "Có được lợi thế trong học tập", "Bỏ học", "Thi trượt"], correctAnswer: 1 },
        { id: 'q41', text: "Access to the internet can ______ students an ______ over those who don't have it.", options: ["give / academic advantage", "gain / academic advantage", "have / negative impact", "cause / misunderstanding"], correctAnswer: 0 },
        { id: 'q42', text: "By attending extra classes, he was able to ______ an ______ and pass the exam with flying colors.", options: ["cause / misunderstanding", "gain / academic advantage", "give / academic advantage", "find / good job"], correctAnswer: 1 },
        { id: 'q43', text: "Face more academic pressure", options: ["Có nhiều thời gian rảnh", "Đối mặt với nhiều áp lực học hành hơn", "Học tập rất nhẹ nhàng", "Không phải đi học"], correctAnswer: 1 },
        { id: 'q44', text: "In their final year of high school, students often ______ to get into university.", options: ["relax", "face more academic pressure", "spend time on screens", "build relationships"], correctAnswer: 1 },
        { id: 'q45', text: "Students in competitive education systems tend to ______ than those in less competitive ones.", options: ["face more academic pressure", "have more chances to relax", "cause less misunderstanding", "find better jobs"], correctAnswer: 0 },
        { id: 'q46', text: "Relaxing", options: ["Thư giãn", "Mang tính thử thách", "Tốn thời gian", "Náo nhiệt"], correctAnswer: 0 },
        { id: 'q47', text: "Listening to music is a ______ hobby that helps me forget about work.", options: ["vibrant", "challenging", "relaxing", "sleek"], correctAnswer: 2 },
        { id: 'q48', text: "After a long day, I enjoy a ______ walk in the park.", options: ["crowded", "time-consuming", "rewarding", "relaxing"], correctAnswer: 3 },
        { id: 'q49', text: "Challenging", options: ["Nhàm chán", "Dễ dàng", "Mang tính thử thách", "Được trả lương cao"], correctAnswer: 2 },
        { id: 'q50', text: "Climbing Mount Everest is a ______ experience that requires a lot of preparation.", options: ["peaceful", "relaxing", "challenging", "cozy"], correctAnswer: 2 },
        { id: 'q51', text: "She loves her job because it's ______ and she learns something new every day.", options: ["time-consuming", "challenging", "tranquil", "spacious"], correctAnswer: 1 },
        { id: 'q52', text: "Rewarding / Meaningful", options: ["Vô ích", "Tốn thời gian", "Đáng làm", "Nhẹ nhàng"], correctAnswer: 2 },
        { id: 'q53', text: "Working as a doctor is a ______ career because you get to save people's lives.", options: ["time-consuming", "crowded", "rewarding", "sleek"], correctAnswer: 2 },
        { id: 'q54', text: "Volunteering at an animal shelter is a very ______ experience for animal lovers.", options: ["vintage", "meaningful", "portable", "vibrant"], correctAnswer: 1 },
        { id: 'q55', text: "Time-consuming", options: ["Tiết kiệm thời gian", "Tốn thời gian", "Vui vẻ", "Nhanh chóng"], correctAnswer: 1 },
        { id: 'q56', text: "Some people find cooking ______ and prefer to eat out or order food.", options: ["rewarding", "time-consuming", "exhilarating", "essential"], correctAnswer: 1 },
        { id: 'q57', text: "Writing a 10,000-word essay can be a very ______ task.", options: ["durable", "peaceful", "spacious", "time-consuming"], correctAnswer: 3 },
        { id: 'q58', text: "Exhilarating / Exciting", options: ["Buồn chán", "Sợ hãi", "Phấn khích", "Mệt mỏi"], correctAnswer: 2 },
        { id: 'q59', text: "Skydiving is an ______ adventure that gives you an incredible rush of adrenaline.", options: ["exhilarating", "tranquil", "cozy", "spacious"], correctAnswer: 0 },
        { id: 'q60', text: "The atmosphere at the rock concert was ______ and the crowd was singing along to every song.", options: ["peaceful", "exciting", "time-consuming", "sentimental"], correctAnswer: 1 },
        { id: 'q61', text: "Peaceful", options: ["Yên tĩnh, lặng im", "Ồn ào, náo nhiệt", "Yên bình, thanh bình", "Thanh bình, yên tĩnh"], correctAnswer: 2 },
        { id: 'q62', text: "My village is very ______ with only the sounds of birds and the wind.", options: ["vibrant", "crowded", "sleek", "peaceful"], correctAnswer: 3 },
        { id: 'q63', text: "She moved to the countryside to look for a more ______ place to live.", options: ["spacious", "peaceful", "portable", "versatile"], correctAnswer: 1 },
        { id: 'q64', text: "Vibrant", options: ["Yên tĩnh và vắng vẻ", "Náo nhiệt và đầy sức sống", "Cổ kính và trầm mặc", "Nhỏ bé và ấm cúng"], correctAnswer: 1 },
        { id: 'q65', text: "New York is known for its ______ nightlife and bustling streets.", options: ["tranquil", "vibrant", "cozy", "durable"], correctAnswer: 1 },
        { id: 'q66', text: "The city's markets are ______ and colorful, full of people selling fresh produce.", options: ["vibrant", "peaceful", "vintage", "compact"], correctAnswer: 0 },
        { id: 'q67', text: "Cozy", options: ["Rộng rãi", "Ấm cúng", "Thời thượng", "Đông đúc"], correctAnswer: 1 },
        { id: 'q68', text: "On a cold winter night, there's nothing better than sitting in a ______ café with a cup of hot chocolate.", options: ["vibrant", "crowded", "cozy", "sleek"], correctAnswer: 2 },
        { id: 'q69', text: "Her apartment is small but very ____, with soft lighting and comfortable furniture.", options: ["spacious", "tranquil", "cozy", "valuable"], correctAnswer: 2 },
        { id: 'q70', text: "Tranquil", options: ["Náo nhiệt", "Ồn ào", "Thanh bình", "Đông đúc"], correctAnswer: 2 },
        { id: 'q71', text: "We spent a ______ weekend at a lake, fishing and reading books.", options: ["tranquil", "exciting", "challenging", "crowded"], correctAnswer: 0 },
        { id: 'q72', text: "The hotel is located in a ______ area, far from the noise of the city.", options: ["sleek", "durable", "tranquil", "vintage"], correctAnswer: 2 },
        { id: 'q73', text: "Spacious", options: ["Chật hẹp", "Rộng rãi", "Tối tăm", "Ẩm thấp"], correctAnswer: 1 },
        { id: 'q74', text: "They are looking for a ______ house with a big garden for their children to play in.", options: ["crowded", "compact", "spacious", "vintage"], correctAnswer: 2 },
        { id: 'q75', text: "The living room is very ______ and can easily accommodate all the guests.", options: ["time-consuming", "spacious", "sentimental", "valuable"], correctAnswer: 1 },
        { id: 'q76', text: "Crowded", options: ["Vắng vẻ", "Rộng rãi", "Đông đúc", "Sạch sẽ"], correctAnswer: 2 },
        { id: 'q77', text: "I don't like taking the bus during rush hour because it's so ______.", options: ["spacious", "crowded", "peaceful", "cozy"], correctAnswer: 1 },
        { id: 'q78', text: "The streets become ______ with tourists during the summer festival.", options: ["crowded", "tranquil", "essential", "portable"], correctAnswer: 0 },
        { id: 'q79', text: "Sleek", options: ["Cồng kềnh và cũ kỹ", "Thời thượng", "Rẻ tiền", "Bền bỉ"], correctAnswer: 1 },
        { id: 'q80', text: "The new laptop has a ______ and modern design in silver.", options: ["cozy", "sleek", "vintage", "spacious"], correctAnswer: 1 },
        { id: 'q81', text: "He drove a ______ black sports car that turned heads wherever he went.", options: ["durable", "crowded", "sleek", "tranquil"], correctAnswer: 2 },
        { id: 'q82', text: "Compact / Portable", options: ["Rất nặng", "Đắt tiền", "Nhỏ gọn", "Khó sử dụng"], correctAnswer: 2 },
        { id: 'q83', text: "This camera is light and ______ , making it perfect for travelers.", options: ["spacious", "portable", "sleek", "vintage"], correctAnswer: 1 },
        { id: 'q84', text: "A ______ umbrella is very useful because it can fit easily into your bag.", options: ["compact", "durable", "sentimental", "vibrant"], correctAnswer: 0 },
        { id: 'q85', text: "Vintage Car", options: ["Xe hiện đại nhất", "Xe cổ điển", "Xe đua", "Xe điện"], correctAnswer: 1 },
        { id: 'q86', text: "She loves wearing ______ dresses from the 1950s.", options: ["sleek", "portable", "vintage", "durable"], correctAnswer: 2 },
        { id: 'q87', text: "This ______ watch has been passed down in my family for generations.", options: ["classic", "compact", "spacious", "crowded"], correctAnswer: 0 },
        { id: 'q88', text: "Durable", options: ["Dễ vỡ", "Bền", "Tạm thời", "Rẻ tiền"], correctAnswer: 1 },
        { id: 'q89', text: "Children need ______ toys that can withstand rough play.", options: ["sentimental", "portable", "durable", "sleek"], correctAnswer: 2 },
        { id: 'q90', text: "This bag is made of high-quality leather, so it's very ______ and will last for years.", options: ["durable", "vintage", "crowded", "tranquil"], correctAnswer: 0 },
        { id: 'q91', text: "Essential", options: ["Không quan trọng", "Thiết yếu", "Vô dụng", "Cổ điển"], correctAnswer: 1 },
        { id: 'q92', text: "A good dictionary is an ______ tool for learning a new language.", options: ["essential", "exhilarating", "spacious", "crowded"], correctAnswer: 0 },
        { id: 'q93', text: "Water is ______ for human survival.", options: ["rewarding", "essential", "versatile", "sentimental"], correctAnswer: 1 },
        { id: 'q94', text: "Sentimental", options: ["Đắt tiền", "Mang giá trị tình cảm", "Rất hiếm", "Rất đẹp"], correctAnswer: 1 },
        { id: 'q95', text: "I keep this old photo because it has ______ value, not because it's worth any money.", options: ["essential", "sentimental", "durable", "portable"], correctAnswer: 1 },
        { id: 'q96', text: "The locket her grandmother gave her is the most ______ item she owns.", options: ["vintage", "sentimental", "spacious", "sleek"], correctAnswer: 1 },
        { id: 'q97', text: "Versatile", options: ["Chỉ dùng được cho một việc", "Linh hoạt, đa năng", "Rất khó sử dụng", "Hay bị hỏng"], correctAnswer: 1 },
        { id: 'q98', text: "A smartphone is a ______ device: it's a phone, a camera, a computer, and more.", options: ["sentimental", "durable", "versatile", "vintage"], correctAnswer: 2 },
        { id: 'q99', text: "Eggs are a ______ ingredient that can be used in both sweet and savory dishes.", options: ["versatile", "time-consuming", "challenging", "crowded"], correctAnswer: 0 },
        { id: 'q100', text: "Valuable", options: ["Không có giá trị", "Rẻ tiền", "Vô giá, quý giá", "Dễ tìm"], correctAnswer: 2 },
        { id: 'q101', text: "She gave me some ______ advice that helped me a lot in my career.", options: ["valuable", "portable", "crowded", "relaxing"], correctAnswer: 0 },
        { id: 'q102', text: "Time is our most ______ resource, so we shouldn't waste it.", options: ["valuable", "vintage", "spacious", "vibrant"], correctAnswer: 0 }
      ]
    }
  ]);
  const [config, setConfig] = useState<GameConfig>({ duration: 60, mode: '1v1', questionSetId: 'set1' });
  const [showSettings, setShowSettings] = useState(true);
  const [showQuestionEditor, setShowQuestionEditor] = useState(false);
  const [editingSet, setEditingSet] = useState<QuestionSet | null>(null);
  const [showRules, setShowRules] = useState(false);
  const [rulePage, setRulePage] = useState(1);
  const [explosions, setExplosions] = useState<{ x: number, y: number, life: number, id: number }[]>([]);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>();
  const lastTimeRef = useRef<number>();
  const lastSpawnTimeRef = useRef<number>(0);

  // Refs to avoid stale closures in socket listeners and game loop
  const configRef = useRef(config);
  const gameStateRef = useRef(gameState);
  const itemsRef = useRef(items);
  const playersRef = useRef(players);
  const roomIdRef = useRef(roomId);

  useEffect(() => { configRef.current = config; }, [config]);
  useEffect(() => { gameStateRef.current = gameState; }, [gameState]);
  useEffect(() => { itemsRef.current = items; }, [items]);
  useEffect(() => { playersRef.current = players; }, [players]);
  useEffect(() => { roomIdRef.current = roomId; }, [roomId]);

  // Hook states for up to 4 players
  const hooks = useRef([
    { angle: 0, length: 50, state: 'swinging', direction: 1, targetX: 0, targetY: 0, caughtItem: null as Item | null },
    { angle: 0, length: 50, state: 'swinging', direction: 1, targetX: 0, targetY: 0, caughtItem: null as Item | null },
    { angle: 0, length: 50, state: 'swinging', direction: 1, targetX: 0, targetY: 0, caughtItem: null as Item | null },
    { angle: 0, length: 50, state: 'swinging', direction: 1, targetX: 0, targetY: 0, caughtItem: null as Item | null },
  ]);

  useEffect(() => {
    const onRoomCreated = (id: string) => setRoomId(id);
    const onPlayerJoined = ({ playerId, playerIndex, name, team }: any) => {
      setPlayers(prev => {
        if (prev.find(p => p.id === playerId)) return prev;
        return [...prev, { 
          id: playerId, 
          name: name || `Player ${playerIndex + 1}`,
          index: playerIndex, 
          team: team || (prev.length % 2 === 0 ? 'A' : 'B'),
          score: 0, 
          status: 'idle',
          askedQuestions: []
        }];
      });
    };
    const onGameStarted = ({ questions: gameQuestions }: { questions: Question[] }) => {
      console.log("Game started event received on host", { roomId: roomIdRef.current });
      setGameState('playing');
      setTimeLeft(configRef.current.duration);
      generateItems();
    };
    const onPlayerAnswerResult = ({ playerId, correct }: any) => {
      setPlayers(prev => prev.map(p => {
        if (p.id === playerId) {
          if (correct) {
            return { ...p, status: 'swinging' as const };
          } else {
            return { ...p, status: 'stunned' as const, stunUntil: Date.now() + 3000 };
          }
        }
        return p;
      }));
    };
    const onPlayerFireHook = ({ playerId }: any) => {
      setPlayers(prev => {
        const player = prev.find(p => p.id === playerId);
        if (player && hooks.current[player.index].state === 'swinging') {
          hooks.current[player.index].state = 'extending';
        }
        return prev;
      });
    };

    socket.on('room-created', onRoomCreated);
    socket.on('player-joined', onPlayerJoined);
    socket.on('game-started', onGameStarted);
    socket.on('player-answer-result', onPlayerAnswerResult);
    socket.on('player-fire-hook', onPlayerFireHook);

    const onConnect = () => {
      if (roomIdRef.current) {
        console.log("Reconnecting to room:", roomIdRef.current);
        socket.emit('host-join-room', roomIdRef.current);
      }
    };
    socket.on('connect', onConnect);

    return () => {
      socket.off('room-created', onRoomCreated);
      socket.off('player-joined', onPlayerJoined);
      socket.off('game-started', onGameStarted);
      socket.off('player-answer-result', onPlayerAnswerResult);
      socket.off('player-fire-hook', onPlayerFireHook);
      socket.off('connect', onConnect);
    };
  }, []); // Only register listeners once

  const generateItems = () => {
    const newItems: Item[] = [];
    
    // Balanced distribution per side
    const sideConfig = [
      { type: 'mole', count: 2 },
      { type: 'gold_small', count: 2 },
      { type: 'gold_medium', count: 2 },
      { type: 'gold_large', count: 1 },
      { type: 'stone', count: 4 },
      { type: 'diamond', count: 1 },
      { type: 'trash', count: 2 },
      { type: 'mine', count: 2 },
    ];

    const numSides = configRef.current.mode === '2v2' ? 4 : 2;
    const canvasWidth = 1200;
    const sideWidth = canvasWidth / numSides;

    for (let side = 0; side < numSides; side++) {
      const startX = side * sideWidth + 20;
      const endX = (side + 1) * sideWidth - 20;

      sideConfig.forEach(cfg => {
        for (let i = 0; i < cfg.count; i++) {
          const itemType = ITEM_TYPES[cfg.type as keyof typeof ITEM_TYPES];
          
          let y = 250 + Math.random() * 450;
          if (cfg.type === 'diamond') {
            y = 600 + Math.random() * 150; // Even deeper
          }

          newItems.push({
            id: Math.random().toString(36).substr(2, 9),
            type: cfg.type as Item['type'],
            x: startX + Math.random() * (endX - startX),
            y,
            radius: itemType.radius,
            points: itemType.points,
            weight: itemType.weight,
            velocityX: cfg.type === 'mole' ? (Math.random() - 0.5) * 2 : 0
          });
        }
      });
    }
    setItems(newItems);
    lastSpawnTimeRef.current = 0;
  };

  const spawnPeriodicItems = () => {
    const newItems: Item[] = [];
    const typesToSpawn = ['gold_medium', 'stone'];
    const numSides = configRef.current.mode === '2v2' ? 4 : 2;
    const canvasWidth = 1200;
    const sideWidth = canvasWidth / numSides;

    for (let side = 0; side < numSides; side++) {
      const startX = side * sideWidth + 20;
      const endX = (side + 1) * sideWidth - 20;

      typesToSpawn.forEach(type => {
        const itemType = ITEM_TYPES[type as keyof typeof ITEM_TYPES];
        newItems.push({
          id: Math.random().toString(36).substr(2, 9),
          type: type as Item['type'],
          x: startX + Math.random() * (endX - startX),
          y: 250 + Math.random() * 450,
          radius: itemType.radius,
          points: itemType.points,
          weight: itemType.weight,
          velocityX: 0
        });
      });
    }
    setItems(prev => [...prev, ...newItems]);
  };

  const updateRef = useRef<(time: number) => void>(null);

  const update = (time: number) => {
    if (lastTimeRef.current !== undefined && gameStateRef.current === 'playing') {
      const deltaTime = (time - lastTimeRef.current) / 1000;

      // Update timer
      setTimeLeft(prev => {
        if (prev <= 0) {
          if (gameStateRef.current === 'playing') {
            console.log("Game over triggered by timer");
            socket.emit('game-over', roomIdRef.current);
            setGameState('finished');
          }
          return 0;
        }
        return prev - deltaTime;
      });

      // Periodic spawning every 30s
      const elapsed = configRef.current.duration - timeLeft;
      if (elapsed > 0 && Math.floor(elapsed / 30) > Math.floor(lastSpawnTimeRef.current / 30)) {
        spawnPeriodicItems();
      }
      lastSpawnTimeRef.current = elapsed;

      // Update explosions
      setExplosions(prev => prev.map(e => ({ ...e, life: e.life - deltaTime * 2 })).filter(e => e.life > 0));

      // Update items (moles)
      setItems(prev => prev.map(item => {
        if (item.type === 'mole' && item.velocityX) {
          let newX = item.x + item.velocityX;
          let newVelX = item.velocityX;
          const numSides = configRef.current.mode === '2v2' ? 4 : 2;
          const canvasWidth = 1200;
          const sideWidth = canvasWidth / numSides;
          const side = Math.floor(item.x / sideWidth);
          const minX = side * sideWidth + 20;
          const maxX = (side + 1) * sideWidth - 20;
          
          if (newX < minX || newX > maxX) {
            newVelX *= -1;
            newX = item.x + newVelX;
          }
          return { ...item, x: newX, velocityX: newVelX };
        }
        return item;
      }));

      // Update hooks
      const canvasWidth = 1200;
      const numPlayers = configRef.current.mode === '2v2' ? 4 : 2;
      const spacing = canvasWidth / numPlayers;

      playersRef.current.forEach(player => {
        const hook = hooks.current[player.index];
        const hookOriginX = (player.index * spacing) + (spacing / 2);
        const hookOriginY = 80;

        if (player.status === 'stunned' && player.stunUntil && Date.now() > player.stunUntil) {
          setPlayers(prev => prev.map(p => p.id === player.id ? { ...p, status: 'idle' } : p));
        }

        if (hook.state === 'swinging') {
          hook.angle += hook.direction * deltaTime * 2.5;
          if (hook.angle > Math.PI / 2.5) {
            hook.angle = Math.PI / 2.5;
            hook.direction = -1;
          } else if (hook.angle < -Math.PI / 2.5) {
            hook.angle = -Math.PI / 2.5;
            hook.direction = 1;
          }
        } else if (hook.state === 'extending') {
          hook.length += 400 * deltaTime;
          const hX = hookOriginX + Math.sin(hook.angle) * hook.length;
          const hY = hookOriginY + Math.cos(hook.angle) * hook.length;

          const hitItem = itemsRef.current.find(item => {
            const dx = item.x - hX;
            const dy = item.y - hY;
            return Math.sqrt(dx * dx + dy * dy) < item.radius + 15;
          });

          if (hitItem) {
            hook.caughtItem = hitItem;
            hook.state = 'retracting';
            setItems(prev => prev.filter(i => i.id !== hitItem.id));
          } else if (hook.length > 800 || hX < -50 || hX > 1250 || hY > 850) {
            hook.state = 'retracting';
          }
        } else if (hook.state === 'retracting') {
          const speed = hook.caughtItem ? 400 / hook.caughtItem.weight : 500;
          hook.length -= speed * deltaTime;
          
          if (hook.length <= 50 || isNaN(hook.length)) {
            hook.length = 50;
            hook.state = 'swinging';
            if (hook.caughtItem) {
              const points = hook.caughtItem.points;
              
              if (hook.caughtItem.type === 'mine') {
                setExplosions(prev => [...prev, { 
                  x: hookOriginX, 
                  y: hookOriginY, 
                  life: 1, 
                  id: Math.random() 
                }]);
              }

              setPlayers(prev => prev.map(p => {
                if (p.index === player.index) {
                  const newScore = p.score + points;
                  socket.emit('update-score', { roomId: roomIdRef.current, playerId: p.id, points });
                  return { ...p, score: newScore, status: 'idle' };
                }
                return p;
              }));
              hook.caughtItem = null;
            } else {
              setPlayers(prev => prev.map(p => p.index === player.index ? { ...p, status: 'idle' } : p));
            }
          }
        }
      });
    }
    lastTimeRef.current = time;
    draw();
    requestRef.current = requestAnimationFrame(updateRef.current!);
  };

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, 1200, 800);

    // Draw background
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(0, 200, 1200, 600);
    ctx.fillStyle = '#DEB887';
    ctx.fillRect(0, 0, 1200, 200);

    // Draw center line
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(600, 0);
    ctx.lineTo(600, 800);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw items
    itemsRef.current.forEach(item => {
      const emojiMap: Record<string, string> = {
        gold_small: '💰',
        gold_medium: '🪙',
        gold_large: '🏺',
        diamond: '💎',
        stone: '🪨',
        mine: '💣',
        mole: '🐹',
        trash: '🥫'
      };

      ctx.save();
      ctx.translate(item.x, item.y);
      ctx.font = `${item.radius * 2}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(emojiMap[item.type] || '❓', 0, 0);
      ctx.restore();
    });

    // Draw hooks
    const canvasWidth = 1200;
    const numPlayers = configRef.current.mode === '2v2' ? 4 : 2;
    const spacing = canvasWidth / numPlayers;

    hooks.current.forEach((hook, idx) => {
      const startX = (idx * spacing) + (spacing / 2);
      const startY = 80;
      const endX = startX + Math.sin(hook.angle) * hook.length;
      const endY = startY + Math.cos(hook.angle) * hook.length;

      // Draw line
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.stroke();

      // Draw hook head
      ctx.save();
      ctx.translate(endX, endY);
      ctx.rotate(-hook.angle);
      ctx.beginPath();
      ctx.moveTo(-10, 0);
      ctx.lineTo(0, 15);
      ctx.lineTo(10, 0);
      ctx.stroke();
      
      if (hook.caughtItem) {
        const emojiMap: Record<string, string> = {
          gold_small: '💰',
          gold_medium: '🪙',
          gold_large: '🏺',
          diamond: '💎',
          stone: '🪨',
          mine: '💣',
          mole: '🐹',
          trash: '🥫'
        };
        ctx.font = `${hook.caughtItem.radius * 2}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(emojiMap[hook.caughtItem.type] || '❓', 0, 15 + hook.caughtItem.radius);
      }
      ctx.restore();

      // Draw player status
      const player = playersRef.current.find(p => p.index === idx);
      if (player) {
        ctx.fillStyle = '#000';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(player.name, startX, 40);
        
        if (player.status === 'stunned') {
          ctx.fillStyle = 'rgba(255,0,0,0.5)';
          ctx.font = 'bold 20px Arial';
          ctx.fillText('STUNNED!', startX, 120);
        }
      }
    });

    // Draw explosions
    explosions.forEach(e => {
      ctx.save();
      ctx.translate(e.x, e.y);
      const size = (1 - e.life) * 100;
      const opacity = e.life;
      
      ctx.fillStyle = `rgba(255, 255, 255, ${opacity * 0.8})`;
      ctx.beginPath();
      ctx.arc(0, 0, size * 1.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = `rgba(255, 100, 0, ${opacity})`;
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        const r = size * (0.8 + Math.random() * 0.4);
        ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
      }
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    });
  };

  useEffect(() => {
    updateRef.current = update;
  });

  useEffect(() => {
    requestRef.current = requestAnimationFrame((time) => {
      if (updateRef.current) updateRef.current(time);
    });
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, []);

  const resetGame = () => {
    setGameState('waiting');
    setPlayers(prev => prev.map(p => ({ ...p, score: 0, status: 'idle', askedQuestions: [] })));
    setItems([]);
    setTimeLeft(config.duration);
    socket.emit('reset-game', roomId);
  };

  const createRoom = () => {
    setRoomId(null); // Clear old room ID while waiting for new one
    socket.emit('host-create-room', config);
    setShowSettings(false);
  };

  const showRulesBeforeStart = () => {
    setRulePage(1);
    setShowRules(true);
  };

  const startGame = () => {
    console.log("Starting game...", { roomId, config });
    setShowRules(false);
    const selectedSet = questionSets.find(s => s.id === config.questionSetId) || questionSets[0];
    socket.emit('start-game', { 
      roomId, 
      questions: selectedSet.questions || [] 
    });
  };

  const nextRule = () => {
    if (rulePage < 3) setRulePage(rulePage + 1);
    else startGame();
  };

  const toggleTeam = (playerId: string) => {
    setPlayers(prev => prev.map(p => {
      if (p.id === playerId) {
        const newTeam = p.team === 'A' ? 'B' : 'A';
        socket.emit('host-assign-team', { roomId, playerId, team: newTeam });
        return { ...p, team: newTeam };
      }
      return p;
    }));
  };

  const [publicUrl, setPublicUrl] = useState<string>('');
  const [copySuccess, setCopySuccess] = useState(false);

  useEffect(() => {
    fetch('/api/url')
      .then(res => res.json())
      .then(data => {
        let url = data.url;
        // Force https for .run.app if not already
        if (url.includes('.run.app') && url.startsWith('http:')) {
          url = url.replace('http:', 'https:');
        }
        setPublicUrl(url);
      })
      .catch(err => console.error('Failed to fetch app URL:', err));
  }, []);

  const getAppUrl = () => {
    const baseUrl = publicUrl || window.location.origin;
    const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    return `${cleanBaseUrl}/?room=${roomId}&mode=${config.mode}`;
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(getAppUrl());
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col items-center justify-center p-4 font-sans overflow-hidden">
      <AnimatePresence>
        {showQuestionEditor && editingSet && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-stone-950/95 z-[200] flex items-center justify-center p-8 backdrop-blur-xl"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-stone-800 p-8 rounded-[2rem] shadow-2xl max-w-4xl w-full border border-stone-700 flex flex-col max-h-[90vh]"
            >
              <div className="flex justify-between items-center mb-6">
                <input 
                  type="text"
                  value={editingSet.name}
                  onChange={(e) => setEditingSet({ ...editingSet, name: e.target.value })}
                  className="text-3xl font-black text-yellow-500 bg-transparent border-b border-stone-700 focus:border-yellow-500 outline-none uppercase italic tracking-tighter"
                />
                <button 
                  onClick={() => {
                    setQuestionSets(prev => prev.map(s => s.id === editingSet.id ? editingSet : s));
                    setShowQuestionEditor(false);
                  }}
                  className="bg-yellow-500 text-stone-950 px-6 py-2 rounded-xl font-bold"
                >
                  Save & Close
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-6 pr-4">
                {editingSet.questions.map((q, qIdx) => (
                  <div key={q.id} className="bg-stone-900 p-6 rounded-2xl border border-stone-700 space-y-4">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1">
                        <label className="text-xs font-bold text-stone-500 uppercase tracking-widest mb-1 block">Question {qIdx + 1}</label>
                        <textarea 
                          value={q.text}
                          onChange={(e) => {
                            const newQuestions = [...editingSet.questions];
                            newQuestions[qIdx].text = e.target.value;
                            setEditingSet({ ...editingSet, questions: newQuestions });
                          }}
                          className="w-full bg-stone-800 border border-stone-700 rounded-xl p-3 text-white focus:border-yellow-500 outline-none"
                          rows={2}
                        />
                      </div>
                      <button 
                        onClick={() => {
                          const newQuestions = editingSet.questions.filter((_, i) => i !== qIdx);
                          setEditingSet({ ...editingSet, questions: newQuestions });
                        }}
                        className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg"
                      >
                        Remove
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {q.options.map((opt, oIdx) => (
                        <div key={oIdx} className="flex items-center gap-2">
                          <input 
                            type="radio"
                            name={`correct-${q.id}`}
                            checked={q.correctAnswer === oIdx}
                            onChange={() => {
                              const newQuestions = [...editingSet.questions];
                              newQuestions[qIdx].correctAnswer = oIdx;
                              setEditingSet({ ...editingSet, questions: newQuestions });
                            }}
                            className="w-4 h-4 accent-yellow-500"
                          />
                          <input 
                            type="text"
                            value={opt}
                            onChange={(e) => {
                              const newQuestions = [...editingSet.questions];
                              newQuestions[qIdx].options[oIdx] = e.target.value;
                              setEditingSet({ ...editingSet, questions: newQuestions });
                            }}
                            className={`flex-1 bg-stone-800 border rounded-lg p-2 text-sm outline-none transition-all ${
                              q.correctAnswer === oIdx ? 'border-yellow-500 text-yellow-500' : 'border-stone-700 text-stone-300'
                            }`}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                
                <button 
                  onClick={() => {
                    const newQuestion: Question = {
                      id: Math.random().toString(36).substr(2, 9),
                      text: '',
                      options: ['', '', '', ''],
                      correctAnswer: 0
                    };
                    setEditingSet({ ...editingSet, questions: [...editingSet.questions, newQuestion] });
                  }}
                  className="w-full py-4 border-2 border-dashed border-stone-700 rounded-2xl text-stone-500 hover:text-stone-300 hover:border-stone-500 transition-all font-bold"
                >
                  + Add New Question
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showRules && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-stone-950/95 z-[100] flex items-center justify-center p-8 backdrop-blur-xl"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-stone-800 p-12 rounded-[3rem] shadow-2xl max-w-5xl w-full border border-stone-700 relative overflow-hidden"
            >
              {/* Progress Bar */}
              <div className="absolute top-0 left-0 right-0 h-2 bg-stone-900">
                <motion.div 
                  className="h-full bg-yellow-500"
                  initial={{ width: "33%" }}
                  animate={{ width: `${(rulePage / 3) * 100}%` }}
                />
              </div>

              <div className="flex justify-between items-center mb-12">
                <h2 className="text-5xl font-black text-yellow-500 uppercase italic tracking-tighter">
                  How to Play <span className="text-stone-500 ml-4">({rulePage}/3)</span>
                </h2>
                <div className="flex gap-2">
                  {[1, 2, 3].map(i => (
                    <div key={i} className={`w-3 h-3 rounded-full ${rulePage === i ? 'bg-yellow-500' : 'bg-stone-600'}`} />
                  ))}
                </div>
              </div>

              <div className="min-h-[300px] flex items-center">
                <AnimatePresence mode="wait">
                  {rulePage === 1 && (
                    <motion.div 
                      key="p1"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="grid grid-cols-2 gap-12 items-center"
                    >
                      <div className="space-y-6">
                        <h3 className="text-3xl font-bold text-white">Step 1: The Quiz</h3>
                        <p className="text-xl text-stone-300 leading-relaxed">
                          Answer quiz questions on your phone. 
                          <br/><br/>
                          <span className="text-green-400 font-bold">✓ Correct:</span> Hook becomes active and starts swinging.
                          <br/>
                          <span className="text-red-400 font-bold">✗ Wrong:</span> You get <span className="underline">STUNNED</span> for 3 seconds and cannot move!
                        </p>
                      </div>
                      <div className="bg-stone-900 p-8 rounded-3xl border border-stone-700 flex justify-center">
                        <div className="text-8xl">❓</div>
                      </div>
                    </motion.div>
                  )}

                  {rulePage === 2 && (
                    <motion.div 
                      key="p2"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="grid grid-cols-2 gap-12 items-center"
                    >
                      <div className="space-y-6">
                        <h3 className="text-4xl font-black text-white uppercase tracking-tighter italic">Step 2: The Hunt</h3>
                        <p className="text-xl text-stone-300 leading-relaxed">
                          Look at the <span className="text-yellow-500 font-bold underline decoration-yellow-500/30">Computer/Projector screen</span> to aim your hook.
                          <br/><br/>
                          When the hook is aimed at a treasure, tap the <span className="bg-red-600 px-6 py-2 rounded-2xl text-white font-black shadow-lg shadow-red-900/50">FIRE</span> button on your phone to launch it!
                        </p>
                      </div>
                      <div className="bg-stone-900 p-8 rounded-3xl border border-stone-700 flex justify-center">
                        <div className="text-8xl animate-pulse">🎯</div>
                      </div>
                    </motion.div>
                  )}

                  {rulePage === 3 && (
                    <motion.div 
                      key="p3"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-8"
                    >
                      <h3 className="text-4xl font-black text-white text-center uppercase tracking-tighter italic">Step 3: Treasure Values</h3>
                      <div className="grid grid-cols-4 gap-4">
                        {[
                          { icon: '💎', name: 'Diamond', pts: '50', desc: 'Hidden deep!' },
                          { icon: '🏺', name: 'Big Gold', pts: '30', desc: 'Heavy' },
                          { icon: '💰', name: 'Gold', pts: '10-20', desc: 'Classic' },
                          { icon: '🐹', name: 'Mole', pts: '5', desc: 'Fast' },
                          { icon: '🪨', name: 'Stone', pts: '5', desc: 'Very Heavy' },
                          { icon: '🥫', name: 'Trash', pts: '0', desc: 'Useless' },
                          { icon: '💣', name: 'Mine', pts: '-20', desc: 'Explosive!' },
                        ].map(item => (
                          <div key={item.name} className="bg-stone-900 p-6 rounded-3xl border border-stone-700 text-center hover:border-yellow-500/50 transition-colors">
                            <div className="text-5xl mb-3">{item.icon}</div>
                            <div className="font-black text-2xl text-yellow-500">{item.pts}</div>
                            <div className="text-xs text-stone-500 uppercase font-bold tracking-widest">{item.name}</div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="mt-12 flex justify-between items-center">
                <div className="text-stone-500 font-mono text-sm uppercase tracking-widest">
                  {rulePage < 3 ? 'Read carefully...' : 'Ready to start?'}
                </div>
                <button 
                  onClick={nextRule}
                  className="bg-yellow-500 hover:bg-yellow-400 text-stone-950 px-10 py-4 rounded-2xl font-black text-xl uppercase tracking-tighter transition-all hover:scale-105 active:scale-95 shadow-xl shadow-yellow-900/20"
                >
                  {rulePage === 3 ? "Let's Go!" : "Next Step"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSettings && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-stone-800 p-8 rounded-3xl shadow-2xl border border-stone-700 max-w-md w-full"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-yellow-500 rounded-2xl">
                <Settings className="text-stone-900" />
              </div>
              <h2 className="text-3xl font-bold">Gold Rush Arena</h2>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-stone-400 mb-2 uppercase tracking-widest">Game Mode</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: '1v1', name: 'Đối Đầu (1v1)', icon: <Users size={16} /> },
                    { id: '2v2', name: 'Đấu Đội (2v2)', icon: <Users size={16} /> }
                  ].map(m => (
                    <button
                      key={m.id}
                      onClick={() => setConfig(prev => ({ ...prev, mode: m.id as GameMode }))}
                      className={`py-3 rounded-xl border transition-all flex flex-col items-center gap-1 ${
                        config.mode === m.id 
                          ? 'bg-yellow-500 border-yellow-500 text-stone-900 font-bold' 
                          : 'border-stone-600 hover:border-stone-400 text-stone-400'
                      }`}
                    >
                      {m.icon}
                      <span className="text-xs">{m.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-400 mb-2 uppercase tracking-widest">Question Set</label>
                <div className="space-y-2">
                  {questionSets.map(set => (
                    <div key={set.id} className="flex gap-2">
                      <button
                        onClick={() => setConfig(prev => ({ ...prev, questionSetId: set.id }))}
                        className={`flex-1 py-3 px-4 rounded-xl border transition-all text-left flex justify-between items-center ${
                          config.questionSetId === set.id 
                            ? 'bg-yellow-500 border-yellow-500 text-stone-900 font-bold' 
                            : 'border-stone-600 hover:border-stone-400 text-stone-400'
                        }`}
                      >
                        <span>{set.name}</span>
                        <span className="text-[10px] opacity-60">{set.questions.length} questions</span>
                      </button>
                      <button 
                        onClick={() => {
                          setEditingSet(set);
                          setShowQuestionEditor(true);
                        }}
                        className="p-3 bg-stone-700 hover:bg-stone-600 rounded-xl text-stone-300"
                      >
                        <Settings size={16} />
                      </button>
                    </div>
                  ))}
                  <button 
                    onClick={() => {
                      const newSet: QuestionSet = {
                        id: Math.random().toString(36).substr(2, 9),
                        name: `Bộ câu hỏi mới ${questionSets.length + 1}`,
                        questions: []
                      };
                      setQuestionSets(prev => [...prev, newSet]);
                      setEditingSet(newSet);
                      setShowQuestionEditor(true);
                    }}
                    className="w-full py-2 border border-dashed border-stone-600 rounded-xl text-stone-500 hover:text-stone-300 hover:border-stone-400 transition-all text-sm"
                  >
                    + Add Question Set
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-400 mb-2 uppercase tracking-widest">Game Duration</label>
                <div className="grid grid-cols-3 gap-2">
                  {[30, 60, 120, 180, 300].map(d => (
                    <button
                      key={d}
                      onClick={() => setConfig(prev => ({ ...prev, duration: d }))}
                      className={`py-2 rounded-xl border transition-all ${
                        config.duration === d 
                          ? 'bg-yellow-500 border-yellow-500 text-stone-900 font-bold' 
                          : 'border-stone-600 hover:border-stone-400 text-stone-400'
                      }`}
                    >
                      {d < 60 ? `${d}s` : `${d/60}m`}
                    </button>
                  ))}
                </div>
              </div>
              
              <button
                onClick={createRoom}
                className="w-full py-4 bg-yellow-500 text-stone-900 rounded-2xl font-bold text-xl hover:bg-yellow-400 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-yellow-900/20"
              >
                <Play fill="currentColor" size={20} />
                Create Room
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!showSettings && gameState === 'waiting' && (
        <div className="flex flex-col items-center gap-12 w-full max-w-7xl">
          <div className="text-center space-y-4">
            <h1 className="text-9xl font-black text-white uppercase italic tracking-tighter leading-none">
              Gold <span className="text-yellow-500">Rush</span>
            </h1>
            <p className="text-2xl text-stone-500 font-mono uppercase tracking-[0.5em]">
              Waiting for Miners...
            </p>
          </div>

          <div className="grid grid-cols-2 gap-16 w-full">
            {/* Left Side: QR & Room Info */}
            <div className="bg-stone-900/50 p-12 rounded-[3rem] border border-stone-800 flex flex-col items-center justify-center gap-8 backdrop-blur-sm">
              {roomId ? (
                <>
                  <div className="bg-white p-6 rounded-3xl shadow-2xl shadow-yellow-500/10">
                    <QRCodeSVG value={getAppUrl()} size={240} />
                  </div>
                  <div className="text-center space-y-2">
                    <p className="text-stone-500 uppercase font-bold tracking-widest text-sm">Scan to Join</p>
                    <p className="text-4xl font-black text-white font-mono">{roomId}</p>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center gap-4">
                  <div className="w-16 h-16 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-stone-500 font-bold uppercase tracking-widest">Creating Room...</p>
                </div>
              )}
              <button 
                onClick={copyToClipboard}
                className="flex items-center gap-3 bg-stone-800 hover:bg-stone-700 text-stone-300 px-8 py-4 rounded-2xl transition-all active:scale-95"
              >
                {copySuccess ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
                <span className="font-bold uppercase tracking-widest text-sm">
                  {copySuccess ? 'Copied!' : 'Copy Link'}
                </span>
              </button>
            </div>

            {/* Right Side: Players List */}
            <div className="flex flex-col gap-6">
              <div className="flex justify-between items-end">
                <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">
                  Players <span className="text-stone-500 ml-2">({players.length}/{config.mode === '2v2' ? 4 : 2})</span>
                </h3>
                <button 
                  onClick={() => setShowSettings(true)}
                  className="p-4 bg-stone-900 hover:bg-stone-800 rounded-2xl text-stone-400 transition-all border border-stone-800"
                >
                  <Settings className="w-6 h-6" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 flex-1">
                {Array.from({ length: config.mode === '2v2' ? 4 : 2 }).map((_, i) => {
                  const player = players[i];
                  return (
                    <div 
                      key={i}
                      onClick={() => {
                        if (player && config.mode === '2v2') {
                          toggleTeam(player.id);
                        }
                      }}
                      className={`h-32 rounded-3xl border-2 flex flex-col items-center justify-center gap-2 transition-all duration-500 ${
                        player 
                          ? 'bg-yellow-500/10 border-yellow-500 shadow-lg shadow-yellow-500/5 cursor-pointer' 
                          : 'bg-stone-900/30 border-stone-800 border-dashed'
                      }`}
                    >
                      {player ? (
                        <>
                          <div className="text-4xl">🐹</div>
                          <span className="font-black text-white uppercase tracking-tighter truncate w-full px-4 text-center">
                            {player.name || `Player ${i + 1}`}
                          </span>
                          <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${
                            player.team === 'A' ? 'bg-blue-500/20 text-blue-400' : 'bg-red-500/20 text-red-400'
                          }`}>
                            Team {player.team}
                          </span>
                        </>
                      ) : (
                        <div className="text-stone-800 font-black text-4xl italic">?</div>
                      )}
                    </div>
                  );
                })}
              </div>

              <button
                onClick={showRulesBeforeStart}
                disabled={players.length < (config.mode === '2v2' ? 4 : 2)}
                className={`w-full py-8 rounded-[2rem] font-black text-3xl uppercase italic tracking-tighter transition-all shadow-2xl ${
                  players.length >= (config.mode === '2v2' ? 4 : 2)
                    ? 'bg-yellow-500 text-stone-950 hover:bg-yellow-400 hover:scale-[1.02] active:scale-95 shadow-yellow-500/20'
                    : 'bg-stone-800 text-stone-600 cursor-not-allowed opacity-50'
                }`}
              >
                {players.length >= (config.mode === '2v2' ? 4 : 2) ? 'Start Battle' : 'Waiting for Players...'}
              </button>
            </div>
          </div>
        </div>
      )}

      {gameState === 'playing' && (
        <div className="relative w-full h-full flex items-center justify-center">
          {/* Game Canvas Container */}
          <div className="relative bg-stone-900 rounded-[2rem] shadow-[0_0_100px_rgba(0,0,0,0.5)] border-8 border-stone-800 overflow-hidden">
            <canvas
              ref={canvasRef}
              width={1200}
              height={800}
              className="block"
            />

            {/* HUD Overlay */}
            <div className="absolute top-0 left-0 right-0 p-8 pointer-events-none flex justify-between items-start">
              {/* Team A / Players 1 & 2 */}
              <div className="flex gap-4">
                <div className="bg-stone-950/80 backdrop-blur-md p-4 rounded-2xl border-2 border-blue-500/30 min-w-[140px] shadow-xl">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                    <p className="text-stone-400 text-[10px] font-black uppercase tracking-widest">
                      {players[0]?.name || 'P1'}
                    </p>
                  </div>
                  <p className="text-4xl font-black text-white tabular-nums">
                    {players[0]?.score || 0}
                  </p>
                </div>
                {config.mode === '2v2' && (
                  <div className="bg-stone-950/80 backdrop-blur-md p-4 rounded-2xl border-2 border-blue-500/30 min-w-[140px] shadow-xl">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                      <p className="text-stone-400 text-[10px] font-black uppercase tracking-widest">
                        {players[1]?.name || 'P2'}
                      </p>
                    </div>
                    <p className="text-4xl font-black text-white tabular-nums">
                      {players[1]?.score || 0}
                    </p>
                  </div>
                )}
              </div>

              {/* Center Timer */}
              <div className="flex flex-col items-center gap-2">
                <div className="bg-stone-950/90 backdrop-blur-xl px-8 py-4 rounded-3xl border-4 border-stone-800 flex items-center gap-4 shadow-2xl">
                  <Clock className="text-yellow-500 w-8 h-8" />
                  <span className={`text-5xl font-mono font-black tabular-nums ${timeLeft < 10 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
                    {Math.ceil(timeLeft)}
                  </span>
                </div>
                {config.mode === '2v2' && (
                  <div className="flex gap-4">
                    <div className="px-4 py-1 bg-blue-500/20 rounded-full border border-blue-500/30">
                      <span className="text-blue-400 font-black text-sm uppercase tracking-tighter">
                        TEAM A: {(players[0]?.score || 0) + (players[1]?.score || 0)}
                      </span>
                    </div>
                    <div className="px-4 py-1 bg-red-500/20 rounded-full border border-red-500/30">
                      <span className="text-red-400 font-black text-sm uppercase tracking-tighter">
                        TEAM B: {(players[2]?.score || 0) + (players[3]?.score || 0)}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Team B / Players 3 & 4 (or Player 2 in 1v1) */}
              <div className="flex gap-4">
                {config.mode === '2v2' ? (
                  <>
                    <div className="bg-stone-950/80 backdrop-blur-md p-4 rounded-2xl border-2 border-red-500/30 min-w-[140px] shadow-xl text-right">
                      <div className="flex items-center justify-end gap-2 mb-1">
                        <p className="text-stone-400 text-[10px] font-black uppercase tracking-widest">
                          {players[2]?.name || 'P3'}
                        </p>
                        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                      </div>
                      <p className="text-4xl font-black text-white tabular-nums">
                        {players[2]?.score || 0}
                      </p>
                    </div>
                    <div className="bg-stone-950/80 backdrop-blur-md p-4 rounded-2xl border-2 border-red-500/30 min-w-[140px] shadow-xl text-right">
                      <div className="flex items-center justify-end gap-2 mb-1">
                        <p className="text-stone-400 text-[10px] font-black uppercase tracking-widest">
                          {players[3]?.name || 'P4'}
                        </p>
                        <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
                      </div>
                      <p className="text-4xl font-black text-white tabular-nums">
                        {players[3]?.score || 0}
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="bg-stone-950/80 backdrop-blur-md p-4 rounded-2xl border-2 border-red-500/30 min-w-[140px] shadow-xl text-right">
                    <div className="flex items-center justify-end gap-2 mb-1">
                      <p className="text-stone-400 text-[10px] font-black uppercase tracking-widest">
                        {players[1]?.name || 'P2'}
                      </p>
                      <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    </div>
                    <p className="text-4xl font-black text-white tabular-nums">
                      {players[1]?.score || 0}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {gameState === 'finished' && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-stone-900 p-16 rounded-[4rem] border-8 border-stone-800 shadow-[0_0_100px_rgba(234,179,8,0.1)] text-center max-w-4xl w-full relative overflow-hidden"
        >
          {/* Decorative Background */}
          <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-yellow-500 rounded-full blur-[100px]" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-yellow-500 rounded-full blur-[100px]" />
          </div>

          <div className="relative z-10 space-y-12">
            <div className="space-y-4">
              <div className="inline-flex p-8 bg-yellow-500 rounded-[2.5rem] shadow-2xl shadow-yellow-500/20 mb-4 rotate-3">
                <Trophy size={80} className="text-stone-950" />
              </div>
              <h2 className="text-7xl font-black text-white uppercase italic tracking-tighter">
                Game Over
              </h2>
            </div>

            {config.mode === '2v2' ? (
              <div className="grid grid-cols-2 gap-8">
                {/* Team A Result */}
                <div className={`p-8 rounded-[2.5rem] border-4 transition-all ${
                  (players.filter(p => p.team === 'A').reduce((acc, p) => acc + p.score, 0)) > 
                  (players.filter(p => p.team === 'B').reduce((acc, p) => acc + p.score, 0))
                    ? 'bg-blue-500/20 border-blue-500 shadow-2xl shadow-blue-500/20 scale-105'
                    : 'bg-stone-800/50 border-stone-700 opacity-50'
                }`}>
                  <p className="text-blue-400 font-black uppercase tracking-widest text-sm mb-2">Team A</p>
                  <p className="text-6xl font-black text-white mb-2">
                    {players.filter(p => p.team === 'A').reduce((acc, p) => acc + p.score, 0)}
                  </p>
                  <p className="text-blue-300 font-bold uppercase tracking-tighter">
                    {(players.filter(p => p.team === 'A').reduce((acc, p) => acc + p.score, 0)) > 
                     (players.filter(p => p.team === 'B').reduce((acc, p) => acc + p.score, 0)) ? 'WINNERS' : 'RUNNERS UP'}
                  </p>
                </div>

                {/* Team B Result */}
                <div className={`p-8 rounded-[2.5rem] border-4 transition-all ${
                  (players.filter(p => p.team === 'B').reduce((acc, p) => acc + p.score, 0)) > 
                  (players.filter(p => p.team === 'A').reduce((acc, p) => acc + p.score, 0))
                    ? 'bg-red-500/20 border-red-500 shadow-2xl shadow-red-500/20 scale-105'
                    : 'bg-stone-800/50 border-stone-700 opacity-50'
                }`}>
                  <p className="text-red-400 font-black uppercase tracking-widest text-sm mb-2">Team B</p>
                  <p className="text-6xl font-black text-white mb-2">
                    {players.filter(p => p.team === 'B').reduce((acc, p) => acc + p.score, 0)}
                  </p>
                  <p className="text-red-300 font-bold uppercase tracking-tighter">
                    {(players.filter(p => p.team === 'B').reduce((acc, p) => acc + p.score, 0)) > 
                     (players.filter(p => p.team === 'A').reduce((acc, p) => acc + p.score, 0)) ? 'WINNERS' : 'RUNNERS UP'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="text-4xl font-black text-yellow-500 uppercase italic tracking-tighter">
                  {players[0]?.score === players[1]?.score ? "It's a Draw!" : 
                   players[0]?.score > (players[1]?.score || 0) ? `${players[0].name} Wins!` : `${players[1]?.name || 'P2'} Wins!`}
                </div>
                <div className="flex justify-center gap-12">
                  <div className="text-center">
                    <p className="text-stone-500 uppercase font-bold tracking-widest text-xs mb-1">{players[0]?.name || 'P1'}</p>
                    <p className="text-5xl font-black text-white">{players[0]?.score || 0}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-stone-500 uppercase font-bold tracking-widest text-xs mb-1">{players[1]?.name || 'P2'}</p>
                    <p className="text-5xl font-black text-white">{players[1]?.score || 0}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="pt-8">
              <button
                onClick={resetGame}
                className="bg-white hover:bg-stone-200 text-stone-950 px-12 py-5 rounded-3xl font-black text-2xl uppercase italic tracking-tighter transition-all hover:scale-105 active:scale-95 shadow-2xl"
              >
                Play Again
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default Host;

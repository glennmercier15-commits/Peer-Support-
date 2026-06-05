import React, { useState, useEffect, useRef } from 'react';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  serverTimestamp, 
  doc, 
  getDoc, 
  onSnapshot, 
  orderBy, 
  limit, 
  updateDoc, 
  setDoc,
  Timestamp
} from 'firebase/firestore';
import { db, auth, OperationType, handleFirestoreError } from '../lib/firebase';
import { ChatRoom, ChatMessage, AppUser } from '../types';
import { 
  Search, 
  Plus, 
  Send, 
  MoreHorizontal, 
  User as UserIcon, 
  Loader2, 
  ChevronLeft,
  Circle,
  MessageSquare,
  Users
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';

export const PeerChat = () => {
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [messageInput, setMessageInput] = useState('');
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [searchResults, setSearchResults] = useState<AppUser[]>([]);
  const [orgUsers, setOrgUsers] = useState<AppUser[]>([]);
  const [currentUserData, setCurrentUserData] = useState<AppUser | null>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (!auth.currentUser) return;

    const fetchInitialData = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', auth.currentUser!.uid));
        if (userDoc.exists()) {
          const userData = { id: userDoc.id, ...userDoc.data() } as AppUser;
          setCurrentUserData(userData);
          
          // Fetch org users
          const q = query(collection(db, 'users'), where('orgId', '==', userData.orgId));
          const snap = await getDocs(q);
          const users = snap.docs
            .map(d => ({ id: d.id, ...d.data() } as AppUser))
            .filter(u => u.id !== auth.currentUser!.uid);
          setOrgUsers(users);
        }
      } catch (err) {
        console.error('Error fetching user data:', err);
      }
    };

    fetchInitialData();

    // Listen for rooms
    const roomsQuery = query(
      collection(db, 'chat_rooms'),
      where('participants', 'array-contains', auth.currentUser.uid),
      orderBy('lastActivity', 'desc')
    );

    const unsubscribeRooms = onSnapshot(roomsQuery, (snap) => {
      const roomData = snap.docs.map(d => ({ id: d.id, ...d.data() } as ChatRoom));
      setRooms(roomData);
      setLoadingRooms(false);
    });

    return () => unsubscribeRooms();
  }, []);

  useEffect(() => {
    if (!selectedRoom) return;

    setLoadingMessages(true);
    const msgsQuery = query(
      collection(db, 'chat_rooms', selectedRoom.id, 'messages'),
      orderBy('timestamp', 'asc'),
      limit(50)
    );

    const unsubscribeMsgs = onSnapshot(msgsQuery, (snap) => {
      const msgData = snap.docs.map(d => ({ id: d.id, ...d.data() } as ChatMessage));
      setMessages(msgData);
      setLoadingMessages(false);
    });

    return () => unsubscribeMsgs();
  }, [selectedRoom]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoom || !messageInput.trim() || !auth.currentUser) return;

    const content = messageInput.trim();
    setMessageInput('');

    try {
      const msgData: Omit<ChatMessage, 'id'> = {
        roomId: selectedRoom.id,
        senderId: auth.currentUser.uid,
        senderName: currentUserData?.name || 'Specialist',
        content,
        timestamp: new Date().toISOString()
      };

      await addDoc(collection(db, 'chat_rooms', selectedRoom.id, 'messages'), msgData);
      await updateDoc(doc(db, 'chat_rooms', selectedRoom.id), {
        lastMessage: content,
        lastActivity: new Date().toISOString()
      });
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  const startPrivateChat = async (targetUser: AppUser) => {
    if (!auth.currentUser || !currentUserData) return;

    // Check if room exists
    const existingRoom = rooms.find(r => 
      r.type === 'direct' && 
      r.participants.includes(targetUser.id) && 
      r.participants.includes(auth.currentUser!.uid)
    );

    if (existingRoom) {
      setSelectedRoom(existingRoom);
      setShowUserSearch(false);
      return;
    }

    try {
      const newRoom: Omit<ChatRoom, 'id'> = {
        orgId: currentUserData.orgId,
        participants: [auth.currentUser.uid, targetUser.id],
        lastActivity: new Date().toISOString(),
        type: 'direct',
        lastMessage: 'Started a conversation'
      };

      const docRef = await addDoc(collection(db, 'chat_rooms'), newRoom);
      setSelectedRoom({ id: docRef.id, ...newRoom });
      setShowUserSearch(false);
    } catch (err) {
      console.error('Error starting chat:', err);
    }
  };

  const currentRoomName = selectedRoom?.type === 'direct' 
    ? orgUsers.find(u => selectedRoom.participants.includes(u.id))?.name || 'Peer Specialist'
    : selectedRoom?.name || 'Group Chat';

  return (
    <div className="max-w-7xl mx-auto h-[calc(100vh-140px)] flex gap-6">
      {/* Sidebar */}
      <div className="w-80 flex flex-col bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-50">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-900">Conversations</h2>
            <button 
              onClick={() => setShowUserSearch(true)}
              className="p-2 bg-teal-50 text-teal-600 rounded-xl hover:bg-teal-100 transition-colors"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Filter chats..." 
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-teal-500"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loadingRooms ? (
            <div className="flex justify-center p-8">
              <Loader2 className="w-6 h-6 animate-spin text-slate-200" />
            </div>
          ) : rooms.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-sm font-medium">
              No conversations yet.
            </div>
          ) : (
            rooms.map(room => {
              const otherUserId = room.participants.find(id => id !== auth.currentUser?.uid);
              const otherUser = orgUsers.find(u => u.id === otherUserId);
              
              return (
                <button
                  key={room.id}
                  onClick={() => setSelectedRoom(room)}
                  className={`w-full p-4 flex items-center gap-4 hover:bg-slate-50 transition-all border-l-4 ${
                    selectedRoom?.id === room.id ? 'bg-teal-50/50 border-teal-500' : 'border-transparent'
                  }`}
                >
                  <div className="relative">
                    <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400">
                      {room.type === 'direct' ? <UserIcon size={20} /> : <Users size={20} />}
                    </div>
                    <Circle size={10} className="absolute -bottom-0.5 -right-0.5 fill-emerald-500 text-white" />
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <div className="flex justify-between items-baseline mb-0.5">
                      <span className="font-bold text-slate-900 truncate">
                        {room.type === 'direct' ? otherUser?.name || 'Specialist' : room.name || 'Group Chat'}
                      </span>
                      <span className="text-[10px] text-slate-400 font-bold uppercase">
                        {format(new Date(room.lastActivity), 'HH:mm')}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 truncate">{room.lastMessage || 'No messages'}</p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden relative">
        <AnimatePresence>
          {showUserSearch && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="absolute inset-0 z-20 bg-white p-8 flex flex-col"
            >
              <div className="flex items-center gap-4 mb-8">
                <button 
                  onClick={() => setShowUserSearch(false)}
                  className="p-2 hover:bg-slate-50 rounded-xl transition-colors"
                >
                  <ChevronLeft className="w-5 h-5 text-slate-400" />
                </button>
                <h3 className="text-2xl font-black text-slate-900">New Conversation</h3>
              </div>

              <div className="space-y-4 overflow-y-auto pr-2">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Organization Members</h4>
                {orgUsers.map(user => (
                  <button
                    key={user.id}
                    onClick={() => startPrivateChat(user)}
                    className="w-full p-4 bg-slate-50 rounded-2xl flex items-center gap-4 hover:bg-teal-50 hover:shadow-sm transition-all text-left group"
                  >
                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-slate-300 group-hover:text-teal-400 transition-colors">
                      <UserIcon size={24} />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900">{user.name}</div>
                      <div className="text-xs text-slate-400 font-medium capitalize">{user.role} specialist</div>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {selectedRoom ? (
          <>
            {/* Header */}
            <div className="p-6 border-b border-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-teal-50 text-teal-600 rounded-xl flex items-center justify-center">
                  {selectedRoom.type === 'direct' ? <UserIcon size={18} /> : <Users size={18} />}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 leading-tight">{currentRoomName}</h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                    <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Active Now</span>
                  </div>
                </div>
              </div>
              <button className="p-2 text-slate-300 hover:text-slate-600 transition-colors">
                <MoreHorizontal size={20} />
              </button>
            </div>

            {/* Messages */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-8 space-y-6 bg-slate-50/30"
            >
              {loadingMessages ? (
                <div className="flex justify-center p-8">
                  <Loader2 className="w-6 h-6 animate-spin text-slate-200" />
                </div>
              ) : messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-12">
                   <div className="w-16 h-16 bg-white rounded-[24px] shadow-sm flex items-center justify-center mb-4 text-teal-200">
                     <MessageSquare size={32} />
                   </div>
                   <h4 className="text-lg font-bold text-slate-900">Start the conversation</h4>
                   <p className="text-sm text-slate-500 mt-1">Send your first message to connect.</p>
                </div>
              ) : (
                messages.map((msg, i) => {
                  const isMe = msg.senderId === auth.currentUser?.uid;
                  return (
                    <div 
                      key={msg.id}
                      className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[70%] group ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                        {!isMe && (
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-2">
                            {msg.senderName}
                          </span>
                        )}
                        <div 
                          className={`px-5 py-3.5 rounded-[24px] text-sm font-medium shadow-sm transition-all ${
                            isMe 
                              ? 'bg-slate-900 text-white rounded-tr-none' 
                              : 'bg-white text-slate-700 rounded-tl-none border border-slate-100'
                          }`}
                        >
                          {msg.content}
                        </div>
                        <span className="text-[9px] text-slate-300 font-bold uppercase mt-1.5 mx-2">
                          {format(new Date(msg.timestamp), 'HH:mm')}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Input */}
            <div className="p-6 bg-white border-t border-slate-50">
              <form 
                onSubmit={handleSendMessage}
                className="flex items-center gap-4"
              >
                <input 
                  type="text" 
                  value={messageInput}
                  onChange={e => setMessageInput(e.target.value)}
                  placeholder="Type your message..." 
                  className="flex-1 px-6 py-4 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-teal-500 font-medium"
                />
                <button 
                  type="submit"
                  disabled={!messageInput.trim()}
                  className="p-4 bg-teal-600 text-white rounded-2xl hover:bg-teal-700 transition-all shadow-lg shadow-teal-100 disabled:opacity-50 disabled:shadow-none"
                >
                  <Send size={18} />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-slate-50/20">
             <div className="w-24 h-24 bg-white rounded-[40px] shadow-sm flex items-center justify-center mb-6 text-slate-200">
                <Users size={48} />
             </div>
             <h3 className="text-2xl font-black text-slate-900 tracking-tight">Peer Support Network</h3>
             <p className="text-slate-500 max-w-sm mt-2 leading-relaxed">
               Select a conversation or start a new one with your colleagues to coordinate care and share support.
             </p>
             <button 
               onClick={() => setShowUserSearch(true)}
               className="mt-8 px-8 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-800 transition-all"
             >
               Find a Specialist
             </button>
          </div>
        )}
      </div>
    </div>
  );
};

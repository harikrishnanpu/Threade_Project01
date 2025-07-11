const Message = require('../models/messageModel');
const Room = require('../models/roomModel');
const User = require('../models/userModel');

const activeUsers = new Map();

module.exports = io => {

  io.on('connection', socket => {

    socket.on('user_online', async ({ userId, name }) => {
      activeUsers.set(userId, socket.id);

      const room = await Room.findOneAndUpdate(
        { userId },
        { userId },                          
        { new: true, upsert: true }
      );

      await User.findByIdAndUpdate(userId, {
        isOnline: true,
        currentRoomId: room._id,
        socketId: socket.id
      });
    
      socket.join(room._id.toString());

      socket.emit('room_assigned', { roomId: room._id });

      const history = await Message.find({ roomId: room._id })
                                   .sort({ createdAt: 1 })
                                   .lean();
      socket.emit('load_messages', history);

      const payload = {
        _id: userId,
        name,
        isOnline: true,
        currentRoomId: room._id
      };

      io.emit('user_connected', payload);

    });

    socket.on('get_online_users', async () => {
      const users = await User.find({ isOnline: true }).select('_id name isOnline currentRoomId').lean();
      socket.emit('online_users', users);
    });

    socket.on('join_room', async ({ roomId }) => {
      socket.join(roomId);
      const msgs = await Message.find({ roomId }).sort({ createdAt: 1 }).lean();
      socket.emit('load_messages', msgs);
    });

    socket.on('leave_room', ({ roomId }) => socket.leave(roomId));

    socket.on('new_message', async ({ roomId, senderId, senderType, message }) => {
      const msg = await Message.create({ roomId, senderId, senderType, message });
      io.to(roomId).emit('new_message', msg);
    });

    socket.on('typing', ({ roomId, senderType }) =>
      socket.to(roomId).emit('user_typing', senderType)
    );


    

    socket.on('disconnect', async () => {
      for (const [userId, sid] of activeUsers.entries()) {
        if (sid === socket.id) {
          activeUsers.delete(userId);
          await User.findByIdAndUpdate(userId, { isOnline: false });
          io.emit('user_disconnected', userId);
          break;
        }
      }
    });


  });
};

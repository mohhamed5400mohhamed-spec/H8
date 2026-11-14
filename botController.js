/**
 * متحكم إدارة البوتات (botController.js)
 * يدير صلاحيات الأدمن فقط، وأحداث Socket.IO الخاصة بإنشاء وتعديل وحذف البوتات والإعدادات والكلمات.
 */

export function registerBotController({ io, botEngine, users, logMonitorEvent }) {
  function isBotAdminUser(user) {
    if (!user) return false;
    const role = String(user.role || '').trim().toLowerCase();
    return role === 'hassan' || role === 'admin';
  }

  function broadcastStateToAdmins() {
    const state = botEngine.getPublicState();
    for (const [socketId, s] of io.sockets.sockets.entries()) {
      const u = users.find((item) => item.id === socketId);
      if (isBotAdminUser(u)) {
        s.emit('botsAdminStateUpdated', state);
      }
    }
  }

  botEngine.onStateChanged(() => {
    broadcastStateToAdmins();
  });

  function emitStateToAdmin(socket) {
    const actor = users.find((u) => u.id === socket.id);
    if (isBotAdminUser(actor)) {
      socket.emit('botsAdminStateUpdated', botEngine.getPublicState());
    }
  }

  function attachSocketHandlers(socket) {
    function requireAdmin() {
      const actor = users.find((u) => u.id === socket.id);
      if (!isBotAdminUser(actor)) {
        socket.emit('botActionResult', { success: false, message: 'قسم إدارة البوتات متاح للأدمن فقط.' });
        return null;
      }
      return actor;
    }

    socket.on('getBotsAdminState', () => {
      const actor = requireAdmin();
      if (!actor) return;
      socket.emit('botsAdminStateUpdated', botEngine.getPublicState());
    });

    socket.on('updateBotSettings', (partial) => {
      const actor = requireAdmin();
      if (!actor) return;
      try {
        botEngine.updateSettings(partial || {});
        if (logMonitorEvent) {
          logMonitorEvent('security', `تحديث إعدادات البوتات بواسطة ${actor.username}`, actor.username);
        }
        socket.emit('botActionResult', { success: true, message: 'تم حفظ إعدادات البوتات بنجاح 🤖' });
      } catch (err) {
        socket.emit('botActionResult', { success: false, message: err?.message || 'تعذر تحديث الإعدادات.' });
      }
    });

    socket.on('createBot', (payload) => {
      const actor = requireAdmin();
      if (!actor) return;
      try {
        const created = botEngine.createBot(payload || {});
        if (logMonitorEvent) {
          logMonitorEvent('role', `إنشاء البوت [${created.username}] بواسطة ${actor.username}`, actor.username, created.username);
        }
        socket.emit('botActionResult', { success: true, action: 'create', message: `تم إنشاء البوت [${created.username}] وتشغيله بنجاح 🤖`, bot: created });
      } catch (err) {
        socket.emit('botActionResult', { success: false, action: 'create', message: err?.message || 'تعذر إنشاء البوت.' });
      }
    });

    socket.on('updateBot', ({ id, data }) => {
      const actor = requireAdmin();
      if (!actor) return;
      try {
        const updated = botEngine.updateBot(id, data || {});
        if (logMonitorEvent) {
          logMonitorEvent('role', `تعديل البوت [${updated.username}] بواسطة ${actor.username}`, actor.username, updated.username);
        }
        socket.emit('botActionResult', { success: true, action: 'update', message: `تم تحديث البوت [${updated.username}] فوراً ✅`, bot: updated });
      } catch (err) {
        socket.emit('botActionResult', { success: false, action: 'update', message: err?.message || 'تعذر تعديل البوت.' });
      }
    });

    socket.on('deleteBot', ({ id }) => {
      const actor = requireAdmin();
      if (!actor) return;
      try {
        const removed = botEngine.deleteBot(id);
        if (logMonitorEvent) {
          logMonitorEvent('role', `حذف البوت [${removed.username}] بواسطة ${actor.username}`, actor.username, removed.username);
        }
        socket.emit('botActionResult', { success: true, action: 'delete', message: `تم حذف البوت [${removed.username}] نهائياً 🗑️` });
      } catch (err) {
        socket.emit('botActionResult', { success: false, action: 'delete', message: err?.message || 'تعذر حذف البوت.' });
      }
    });

    socket.on('toggleBotEnabled', ({ id, enabled }) => {
      const actor = requireAdmin();
      if (!actor) return;
      try {
        const updated = botEngine.toggleBotEnabled(id, enabled);
        socket.emit('botActionResult', {
          success: true,
          action: 'toggle',
          message: updated.enabled ? `تم تشغيل البوت [${updated.username}] 🟢` : `تم إيقاف البوت [${updated.username}] ⚪`
        });
      } catch (err) {
        socket.emit('botActionResult', { success: false, action: 'toggle', message: err?.message || 'تعذر تغيير حالة البوت.' });
      }
    });

    socket.on('addBotReply', ({ keyword, reply }) => {
      const actor = requireAdmin();
      if (!actor) return;
      try {
        const item = botEngine.addBotReply(keyword, reply);
        socket.emit('botActionResult', { success: true, action: 'addReply', message: `تمت إضافة كلمة [${item.keyword}] للبوت ✅`, item });
      } catch (err) {
        socket.emit('botActionResult', { success: false, action: 'addReply', message: err?.message || 'تعذر إضافة الكلمة.' });
      }
    });

    socket.on('updateBotReply', ({ id, keyword, reply }) => {
      const actor = requireAdmin();
      if (!actor) return;
      try {
        const item = botEngine.updateBotReply(id, keyword, reply);
        socket.emit('botActionResult', { success: true, action: 'updateReply', message: `تم تعديل رد كلمة [${item.keyword}] ✅`, item });
      } catch (err) {
        socket.emit('botActionResult', { success: false, action: 'updateReply', message: err?.message || 'تعذر تعديل الكلمة.' });
      }
    });

    socket.on('deleteBotReply', ({ id }) => {
      const actor = requireAdmin();
      if (!actor) return;
      try {
        const removed = botEngine.deleteBotReply(id);
        socket.emit('botActionResult', { success: true, action: 'deleteReply', message: `تم حذف كلمة [${removed.keyword}] 🗑️` });
      } catch (err) {
        socket.emit('botActionResult', { success: false, action: 'deleteReply', message: err?.message || 'تعذر حذف الكلمة.' });
      }
    });
  }

  return {
    isBotAdminUser,
    attachSocketHandlers,
    emitStateToAdmin,
    broadcastStateToAdmins
  };
}

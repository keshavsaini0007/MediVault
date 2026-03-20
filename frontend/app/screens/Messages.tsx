import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import BottomNavLayout from '../../components/BottomNavLayout';
import { useTheme } from '../../context/ThemeContext';
import { useBadges } from '../../context/BadgeContext';

const CONVERSATIONS = [
  { id:1, name:'Rahul Singh',  initials:'RS', condition:'Dengue',       time:'2 min', online:true  },
  { id:2, name:'Anita Rao',    initials:'AR', condition:'Diabetes',     time:'1 hr',  online:false },
  { id:3, name:'Vikram Patel', initials:'VP', condition:'Asthma',       time:'3 hrs', online:false },
  { id:4, name:'Priya Sharma', initials:'PS', condition:'Hypertension', time:'Yest',  online:true  },
];

export default function MessagesScreen() {
  const { colors, userName, userInitial } = useTheme();
  // ✅ messages, openConv, sendMessage all live in context — persist across navigation
  const { clearMessages, messages, openConv, sendMessage } = useBadges();

  // Clear sidebar Messages badge when screen opens
  useEffect(() => { clearMessages(); }, []);

  // activeConv and input are fine as local state — they are UI-only, not data
  const [activeConv, setActiveConv] = React.useState<number | null>(null);
  const [input, setInput]           = React.useState('');
  const scrollRef = useRef<ScrollView>(null);

  const handleOpenConv = (id: number) => {
    openConv(id); // marks messages as read in context
    setActiveConv(id);
  };

  const handleGoBack = () => {
    setActiveConv(null);
    setInput('');
  };

  const handleSend = () => {
    if (!input.trim() || !activeConv) return;
    sendMessage(activeConv, input.trim()); // persists in context
    setInput('');
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
  };

  const getUnread = (id: number) =>
    (messages[id] || []).filter(m => m.from === 'patient' && !m.read).length;

  const getLastMsg = (id: number): string => {
    const thread = messages[id];
    if (!thread || thread.length === 0) return 'No messages yet';
    return thread[thread.length - 1].text;
  };

  const activePatient = CONVERSATIONS.find(c => c.id === activeConv);
  const thread        = activeConv ? (messages[activeConv] || []) : [];

  /* ── Conversation List ── */
  if (!activeConv) {
    return (
      <BottomNavLayout title="Messages" subtitle="Patient communications" role="doctor">
        <View style={{ flex: 1, backgroundColor: colors.bgPage }}>

          {/* Search */}
          <View style={[s.searchWrap, { backgroundColor: colors.bgCard, borderBottomColor: colors.border }]}>
            <Ionicons name="search" size={18} color={colors.textFaint} style={{ marginRight: 8 }} />
            <TextInput
              style={[s.searchInput, { color: colors.textPrimary }]}
              placeholder="Search patients…"
              placeholderTextColor={colors.textFaint}
            />
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {CONVERSATIONS.map(conv => {
              const unreadCount = getUnread(conv.id);
              const lastMsg     = getLastMsg(conv.id);
              const hasUnread   = unreadCount > 0;
              return (
                <TouchableOpacity key={conv.id} onPress={() => handleOpenConv(conv.id)} activeOpacity={0.75}
                  style={[s.convItem, {
                    backgroundColor: colors.bgCard,
                    borderBottomColor: colors.borderSoft,
                    borderLeftColor: hasUnread ? colors.primary : 'transparent',
                    borderLeftWidth: 3,
                  }]}>
                  <View style={{ position: 'relative', flexShrink: 0 }}>
                    <View style={[s.convAvatar, { backgroundColor: hasUnread ? colors.primary : colors.border }]}>
                      <Text style={{ fontSize: 13, fontWeight: '800', color: hasUnread ? 'white' : colors.textMuted }}>
                        {conv.initials}
                      </Text>
                    </View>
                    {conv.online && (
                      <View style={[s.onlineDot, { backgroundColor: colors.success, borderColor: colors.bgCard }]} />
                    )}
                  </View>

                  <View style={{ flex: 1, marginLeft: 12, minWidth: 0 }}>
                    <Text style={{ fontWeight: hasUnread ? '800' : '600', fontSize: 14, color: colors.textPrimary }}>
                      {conv.name}
                    </Text>
                    <Text style={{ fontSize: 11, color: colors.textFaint, marginTop: 1 }}>{conv.condition}</Text>
                    <Text style={{
                      fontSize: 12, marginTop: 3,
                      color:      hasUnread ? colors.textPrimary : colors.textFaint,
                      fontWeight: hasUnread ? '600' : '400',
                    }} numberOfLines={1}>{lastMsg}</Text>
                  </View>

                  <View style={{ alignItems: 'flex-end', gap: 5, marginLeft: 10, flexShrink: 0, minWidth: 46 }}>
                    <Text style={{ fontSize: 10, color: colors.textFaint }}>{conv.time}</Text>
                    {hasUnread ? (
                      <View style={[s.unreadBadge, { backgroundColor: colors.primary }]}>
                        <Text style={{ color: 'white', fontSize: 10, fontWeight: '800' }}>{unreadCount}</Text>
                      </View>
                    ) : (
                      <Ionicons name="checkmark" size={14} color={colors.primary} />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </BottomNavLayout>
    );
  }

  /* ── Chat View ── */
  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <BottomNavLayout
        title={activePatient?.name || 'Chat'}
        subtitle={activePatient?.condition}
        role="doctor"
        showBack
        onBack={handleGoBack}
        headerRight={
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity style={[s.chatIconBtn, { borderColor: 'rgba(255,255,255,0.3)' }]}>
              <Ionicons name="call-outline" size={18} color="white" />
            </TouchableOpacity>
            <TouchableOpacity style={[s.chatIconBtn, { borderColor: 'rgba(255,255,255,0.3)' }]}>
              <Ionicons name="videocam-outline" size={18} color="white" />
            </TouchableOpacity>
          </View>
        }
      >
        <View style={{ flex: 1, backgroundColor: colors.bgPage }}>
          <ScrollView ref={scrollRef}
            contentContainerStyle={{ padding: 16, paddingBottom: 8 }}
            showsVerticalScrollIndicator={false}>
            {thread.map(msg => {
              const isDoc = msg.from === 'doctor';
              return (
                <View key={msg.id} style={{ alignItems: isDoc ? 'flex-end' : 'flex-start', marginBottom: 10 }}>
                  <View style={[s.bubble, {
                    backgroundColor: isDoc ? colors.primary : colors.bgCard,
                    borderColor: isDoc ? 'transparent' : colors.border,
                    borderTopRightRadius: isDoc ? 4 : 18,
                    borderTopLeftRadius:  isDoc ? 18 : 4,
                  }]}>
                    <Text style={{ fontSize: 14, lineHeight: 20, color: isDoc ? 'white' : colors.textPrimary }}>
                      {msg.text}
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 4, marginTop: 4 }}>
                      <Text style={{ fontSize: 10, opacity: 0.55, color: isDoc ? 'white' : colors.textFaint }}>
                        {msg.time}
                      </Text>
                      {isDoc && (
                        <Ionicons name={msg.read ? 'checkmark-done' : 'checkmark'} size={12} color={msg.read ? '#86EFAC' : 'rgba(255,255,255,0.5)'} />
                      )}
                    </View>
                  </View>
                </View>
              );
            })}
          </ScrollView>

          <View style={[s.inputBar, { backgroundColor: colors.bgCard, borderTopColor: colors.border }]}>
            <TextInput
              style={[s.msgInput, { backgroundColor: colors.bgPage, borderColor: colors.border, color: colors.textPrimary }]}
              placeholder="Type a message…"
              value={input}
              onChangeText={setInput}
              multiline
              placeholderTextColor={colors.textFaint}
            />
            <TouchableOpacity onPress={handleSend}
              style={[s.sendBtn, { backgroundColor: colors.primary, opacity: input.trim() ? 1 : 0.5 }]}>
              <Ionicons name="send" size={18} color="white" />
            </TouchableOpacity>
            </View>
          </View>
        </BottomNavLayout>
      </KeyboardAvoidingView>
    );
  }

const s = StyleSheet.create({
  searchWrap:   { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  searchInput:  { flex: 1, fontSize: 14 },
  convItem:     { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderLeftWidth: 3, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 4, elevation: 1 },
  convAvatar:   { width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center' },
  onlineDot:    { position: 'absolute', bottom: 1, right: 1, width: 12, height: 12, borderRadius: 6, borderWidth: 2 },
  unreadBadge:  { minWidth: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  chatIconBtn:  { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  bubble:       { maxWidth: '80%', padding: 14, borderRadius: 20, borderWidth: 1, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 6, elevation: 2 },
  inputBar:     { flexDirection: 'row', padding: 14, borderTopWidth: 1, gap: 12, alignItems: 'flex-end' },
  msgInput:     { flex: 1, borderWidth: 1.5, borderRadius: 24, paddingHorizontal: 18, paddingVertical: 12, fontSize: 14, maxHeight: 100 },
  sendBtn:      { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 6, elevation: 3 },
});

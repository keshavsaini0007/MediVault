import React, { useState, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';
import DrawerLayout from '../../components/DrawerLayout';
import Colors from '../../constants/colors';

const CONVERSATIONS = [
  { id: 1, name: 'Rahul Singh',  initials: 'RS', condition: 'Dengue',       lastMsg: 'Doctor, my fever is still high.',           time: '2 min',    unread: 2, online: true  },
  { id: 2, name: 'Anita Rao',    initials: 'AR', condition: 'Diabetes',     lastMsg: 'Thank you for the prescription update.',     time: '1 hr',     unread: 0, online: false },
  { id: 3, name: 'Vikram Patel', initials: 'VP', condition: 'Asthma',       lastMsg: 'I have been taking the inhaler as advised.', time: '3 hrs',    unread: 0, online: false },
  { id: 4, name: 'Priya Sharma', initials: 'PS', condition: 'Hypertension', lastMsg: 'Blood pressure is 130/85 today.',            time: 'Yesterday',unread: 1, online: true  },
];

type Message = { id: number; from: 'patient' | 'doctor'; text: string; time: string };

const MESSAGES: Record<number, Message[]> = {
  1: [
    { id: 1, from: 'patient', text: 'Hello Doctor, I have been having high fever since yesterday morning.', time: '10:02 AM' },
    { id: 2, from: 'doctor',  text: 'Hello Rahul, I can see your symptoms. How high is the temperature right now?', time: '10:05 AM' },
    { id: 3, from: 'patient', text: 'It is 104°F. I also have severe headache and body pain.', time: '10:07 AM' },
    { id: 4, from: 'doctor',  text: 'Please take Paracetamol 500mg immediately and drink plenty of fluids.', time: '10:09 AM' },
    { id: 5, from: 'patient', text: 'Doctor, my fever is still high.', time: '10:45 AM' },
  ],
};

export default function MessagesScreen() {
  const router = useRouter();
  const { role, userName, userInitial, colors } = useTheme();
  const [activeConv, setActiveConv] = useState(1);
  const [messages, setMessages] = useState(MESSAGES);
  const [input, setInput] = useState('');
  const [showList, setShowList] = useState(true);
  const scrollRef = useRef<ScrollView>(null);

  const send = () => {
    if (!input.trim()) return;
    const newMsg: Message = {
      id: Date.now(),
      from: 'doctor',
      text: input.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages(prev => ({ ...prev, [activeConv]: [...(prev[activeConv] || []), newMsg] }));
    setInput('');
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const activePatient = CONVERSATIONS.find(c => c.id === activeConv);
  const thread = messages[activeConv] || [];

  if (showList) {
    return (
      <DrawerLayout title="Messages" subtitle="Patient communications">
        {/* Search */}
        <View style={styles.searchBox}>
          <Text style={{ marginRight: 6, color: Colors.gray400 }}>🔍</Text>
          <TextInput placeholder="Search patients…" style={styles.searchInput} placeholderTextColor={Colors.gray400} />
        </View>

        <ScrollView>
          {CONVERSATIONS.map(conv => {
            const isActive = activeConv === conv.id;
            return (
              <TouchableOpacity key={conv.id} onPress={() => { setActiveConv(conv.id); setShowList(false); }} style={[styles.convItem, isActive && styles.convItemActive]}>
                <View style={{ position: 'relative' }}>
                  <View style={[styles.convAvatar, { backgroundColor: isActive ? Colors.primary : Colors.gray200 }]}>
                    <Text style={{ fontSize: 12, fontWeight: '800', color: isActive ? 'white' : Colors.gray600 }}>{conv.initials}</Text>
                  </View>
                  {conv.online && <View style={styles.onlineDot} />}
                </View>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ fontWeight: '700', fontSize: 13, color: isActive ? Colors.primary : Colors.gray800 }}>{conv.name}</Text>
                    <Text style={{ fontSize: 10, color: Colors.gray400 }}>{conv.time}</Text>
                  </View>
                  <Text style={{ fontSize: 11, color: Colors.gray400, marginTop: 1 }}>{conv.condition}</Text>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 2 }}>
                    <Text style={{ fontSize: 11, color: Colors.gray500, flex: 1 }} numberOfLines={1}>{conv.lastMsg}</Text>
                    {conv.unread > 0 && (
                      <View style={styles.unreadBadge}><Text style={{ color: 'white', fontSize: 9, fontWeight: '800' }}>{conv.unread}</Text></View>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </DrawerLayout>
    );
  }

  // Chat view
  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <DrawerLayout title={activePatient?.name || 'Chat'} subtitle={activePatient?.condition} showBack>
        <View>
          <TouchableOpacity onPress={() => setShowList(true)} style={{ marginRight: 12 }}>
            <Text style={{ color: 'white', fontSize: 18 }}>←</Text>
          </TouchableOpacity>
          <View style={styles.chatAvatar}>
            <Text style={{ fontSize: 13, fontWeight: '800', color: Colors.primary }}>{activePatient?.initials}</Text>
          </View>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={{ fontWeight: '700', fontSize: 14, color: 'white' }}>{activePatient?.name}</Text>
            <Text style={{ fontSize: 11, color: activePatient?.online ? '#86EFAC' : 'rgba(255,255,255,0.5)' }}>
              {activePatient?.online ? '● Online' : '○ Offline'} · {activePatient?.condition}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <Text style={{ fontSize: 20 }}>📞</Text>
            <Text style={{ fontSize: 20 }}>📹</Text>
          </View>
        </View>

        {/* Messages */}
        <ScrollView ref={scrollRef} style={styles.messageArea} contentContainerStyle={{ padding: 16, gap: 12 }} showsVerticalScrollIndicator={false}>
          {thread.map(msg => {
            const isDoctor = msg.from === 'doctor';
            return (
              <View key={msg.id} style={{ alignItems: isDoctor ? 'flex-end' : 'flex-start' }}>
                <View style={[styles.bubble, isDoctor ? styles.bubbleDoctor : styles.bubblePatient]}>
                  <Text style={{ color: isDoctor ? 'white' : Colors.gray800, fontSize: 13, lineHeight: 19 }}>{msg.text}</Text>
                  <Text style={{ fontSize: 10, marginTop: 4, opacity: 0.55, textAlign: 'right', color: isDoctor ? 'white' : Colors.gray500 }}>{msg.time}</Text>
                </View>
              </View>
            );
          })}
        </ScrollView>

        {/* Input */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.msgInput}
            placeholder="Type a message…"
            value={input}
            onChangeText={setInput}
            multiline
            placeholderTextColor={Colors.gray400}
          />
          <TouchableOpacity onPress={send} style={styles.sendBtn}>
            <Text style={{ color: 'white', fontWeight: '700', fontSize: 13 }}>Send ↑</Text>
          </TouchableOpacity>
        </View>
      </DrawerLayout>
    </KeyboardAvoidingView>
  );
} 

const styles = StyleSheet.create({
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border, paddingHorizontal: 16, paddingVertical: 10 },
  searchInput: { flex: 1, fontSize: 13, color: Colors.gray800 },
  convItem: { flexDirection: 'row', alignItems: 'center', padding: 14, borderBottomWidth: 1, borderBottomColor: Colors.gray100, borderLeftWidth: 3, borderLeftColor: 'transparent' },
  convItemActive: { backgroundColor: Colors.primarySoft, borderLeftColor: Colors.primary },
  convAvatar: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  onlineDot: { position: 'absolute', bottom: 0, right: 0, width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.success, borderWidth: 2, borderColor: 'white' },
  unreadBadge: { backgroundColor: Colors.primary, paddingHorizontal: 6, paddingVertical: 1, borderRadius: 10 },
  chatHeader: { backgroundColor: Colors.primaryDark, paddingTop: 52, paddingBottom: 14, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center' },
  chatAvatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: Colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  messageArea: { flex: 1 },
  bubble: { maxWidth: '75%', padding: 12, borderRadius: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  bubbleDoctor: { backgroundColor: Colors.primary, borderTopRightRadius: 4 },
  bubblePatient: { backgroundColor: Colors.white, borderTopLeftRadius: 4, borderWidth: 1, borderColor: Colors.border },
  inputBar: { flexDirection: 'row', padding: 12, borderTopWidth: 1, borderTopColor: Colors.border, backgroundColor: Colors.white, gap: 10, alignItems: 'flex-end' },
  msgInput: { flex: 1, backgroundColor: Colors.gray50, borderWidth: 1.5, borderColor: Colors.border, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: Colors.gray900, maxHeight: 100 },
  sendBtn: { backgroundColor: Colors.primary, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 10 },
});

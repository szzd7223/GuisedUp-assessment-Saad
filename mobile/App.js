import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, SafeAreaView, StatusBar, StyleSheet, Text, TextInput, View } from 'react-native';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:8000/api';
const TOKEN = process.env.EXPO_PUBLIC_API_TOKEN || '';
const api = (path, options = {}) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  return fetch(`${API_URL}${path}`, {
    ...options,
    signal: controller.signal,
    headers: { Accept: 'application/json', Authorization: `Bearer ${TOKEN}`, ...(options.headers || {}) },
  }).finally(() => clearTimeout(timeout));
};

function PostCard({ post, onReact }) {
  return <View style={styles.card}>
    <View style={styles.row}><View style={styles.avatar}><Text style={styles.avatarText}>{post.author.name[0]}</Text></View><View><Text style={styles.name}>{post.author.name}</Text><Text style={styles.time}>{post.time_ago}</Text></View></View>
    <Text style={styles.body}>{post.text}</Text>
    <Pressable style={styles.react} onPress={() => onReact(post.id)}><Text style={styles.reactText}>♡  Real reaction</Text></Pressable>
  </View>;
}

export default function App() {
  const [posts, setPosts] = useState([]); const [page, setPage] = useState(1); const [loading, setLoading] = useState(true); const [more, setMore] = useState(true); const [error, setError] = useState(''); const [query, setQuery] = useState(''); const [searching, setSearching] = useState(false);
  const loadFeed = useCallback(async (next = 1) => { try { setLoading(true); setError(''); const response = await api(`/feed?page=${next}`); if (!response.ok) throw Error('Could not load your connections.'); const json = await response.json(); setPosts(previous => next === 1 ? json.data : [...previous, ...json.data]); setPage(next); setMore(Boolean(json.meta?.next_page_url)); } catch (e) { setError(e.message); } finally { setLoading(false); } }, []);
  useEffect(() => { loadFeed(); }, [loadFeed]);
  const search = async () => { if (!query.trim()) return loadFeed(); try { setSearching(true); const response = await api(`/search?q=${encodeURIComponent(query)}`); if (!response.ok) throw Error('Search failed.'); const json = await response.json(); setPosts(json.data); setMore(false); } catch (e) { setError(e.message); } finally { setSearching(false); } };
  const react = async id => { await api('/interactions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ post_id: id, type: 'reaction' }) }); };
  return <SafeAreaView style={styles.screen}><StatusBar barStyle="dark-content" /><View style={styles.header}><Text style={styles.title}>Real connections</Text><Text style={styles.subtitle}>People and moments that matter to you.</Text><View style={styles.search}><TextInput value={query} onChangeText={setQuery} onSubmitEditing={search} placeholder="Search moments, not metrics" style={styles.input}/><Pressable onPress={search}><Text style={styles.go}>{searching ? '...' : 'Search'}</Text></Pressable></View></View>{error ? <View style={styles.state}><Text>{error}</Text><Pressable onPress={() => loadFeed()}><Text style={styles.retry}>Try again</Text></Pressable></View> : <FlatList data={posts} keyExtractor={item => String(item.id)} renderItem={({item}) => <PostCard post={item} onReact={react}/>} onEndReached={() => more && !loading && loadFeed(page + 1)} onEndReachedThreshold={0.5} ListEmptyComponent={!loading && <View style={styles.state}><Text>No moments here yet.</Text></View>} ListFooterComponent={loading && <ActivityIndicator color="#5b4bdb" style={styles.loader}/>} contentContainerStyle={styles.list}/>}</SafeAreaView>;
}
const styles = StyleSheet.create({ screen:{flex:1,backgroundColor:'#f7f6fb'},header:{padding:20,paddingBottom:12},title:{fontSize:29,fontWeight:'800',color:'#201b36'},subtitle:{color:'#716b82',marginTop:4},search:{marginTop:18,backgroundColor:'#fff',borderRadius:14,paddingHorizontal:14,flexDirection:'row',alignItems:'center',shadowColor:'#221',shadowOpacity:.06,shadowRadius:10,elevation:2},input:{flex:1,paddingVertical:14,color:'#201b36'},go:{fontWeight:'700',color:'#5b4bdb'},list:{padding:16,paddingTop:4},card:{backgroundColor:'#fff',borderRadius:20,padding:16,marginBottom:12},row:{flexDirection:'row',alignItems:'center'},avatar:{width:38,height:38,borderRadius:19,backgroundColor:'#ded9ff',justifyContent:'center',alignItems:'center',marginRight:10},avatarText:{fontWeight:'800',color:'#4d3ac4'},name:{fontWeight:'700',color:'#28223b'},time:{fontSize:12,color:'#8b8598',marginTop:2},body:{fontSize:16,lineHeight:23,color:'#393247',marginTop:15},react:{alignSelf:'flex-start',marginTop:14,paddingVertical:8,paddingHorizontal:11,backgroundColor:'#f1efff',borderRadius:20},reactText:{color:'#5140c5',fontWeight:'700'},state:{alignItems:'center',padding:32,gap:10},retry:{color:'#5140c5',fontWeight:'700'},loader:{margin:20} });

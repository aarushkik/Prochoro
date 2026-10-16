/** Isolated visual QA entry. Never imported by index.ts; no auth or profile provider. */
import React, { useState } from 'react';
import { registerRootComponent } from 'expo';
import { ScrollView, Text, View, Pressable, useWindowDimensions } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { Baloo2_600SemiBold, Baloo2_700Bold, Baloo2_800ExtraBold } from '@expo-google-fonts/baloo-2';
import { Figtree_500Medium, Figtree_600SemiBold, Figtree_700Bold, Figtree_800ExtraBold, Figtree_900Black } from '@expo-google-fonts/figtree';
import { ThemeProvider, useAppTheme, useAppearancePreference } from '../src/theme/ThemeProvider';
import { fonts } from '../src/theme';
import { Backdrop } from '../src/components/ui/Backdrop';
import { CourseCard } from '../src/components/ui/CourseCard';
import { NextQuestCard } from '../src/components/home/NextQuestCard';
import { TrailSegment } from '../src/components/home/TrailSegment';
import { QuestTabBar, type QuestTab } from '../src/components/home/QuestTabBar';
import { CompanionSprite } from '../src/components/creatures/CompanionSprite';
import { BossSprite } from '../src/components/creatures/BossSprite';
import { bossForNode } from '../src/data/bosses';
import { apCourses } from '../src/data/apCourses';
import { getQuestMap } from '../src/data/questMap';
import { COMPANIONS } from '../src/data/companions';
import { GlassSurface } from '../src/components/ui/GlassSurface';

function Preview() {
 const [loaded] = useFonts({ Baloo2_600SemiBold, Baloo2_700Bold, Baloo2_800ExtraBold, Figtree_500Medium, Figtree_600SemiBold, Figtree_700Bold, Figtree_800ExtraBold, Figtree_900Black });
 const theme = useAppTheme(); const appearance = useAppearancePreference();
 const [tab,setTab] = useState<QuestTab>('map'); const [courseId,setCourseId]=useState('ap-biology');
 const width=Math.min(useWindowDimensions().width,560); const map=getQuestMap(courseId); const node=map.units[0].nodes[0];
 const heading={fontFamily:fonts.displayHeavy,fontSize:26,color:theme.colors.ink};
 if(!loaded) return null;
 return <View style={{flex:1,backgroundColor:theme.colors.background}}><Backdrop/><View style={{width,flex:1,alignSelf:'center'}}>
 <ScrollView key={tab} contentContainerStyle={{paddingBottom:108}}>
 <View style={{padding:18,gap:8}}><Text style={{fontFamily:fonts.bodyBold,fontSize:12,color:theme.colors.textSecondary}}>DESIGN PREVIEW · SAMPLE DATA</Text>
 <Text style={heading}>{tab==='map'?'Your study trail':tab==='practice'?'Find your next subject':tab==='progress'?'Meet the boss rivals':'Make it yours'}</Text></View>
 {tab==='map'?<><NextQuestCard node={node} course={apCourses.find(c=>c.id===courseId)!.name} courseId={courseId} todayCount={1} dailyGoal={3} onContinue={()=>{}} active={false}/>
 {map.units.map((unit,i)=><TrailSegment key={unit.id} unit={unit} width={width} mode={i===0?'next':'locked'} stateOf={()=>'locked'} onSelect={()=>{}} animated={false}/>)}</>:null}
 {tab==='practice'?<View style={{paddingHorizontal:18}}>{apCourses.map(course=><CourseCard key={course.id} course={course} selected={course.id===courseId} onPress={()=>setCourseId(course.id)}/>)}</View>:null}
 {tab==='progress'?<View style={{padding:18,gap:16}}>{map.units.map(unit=><View key={unit.id} style={[theme.card,{padding:16,borderRadius:24}]}><Text style={[heading,{fontSize:20}]}>{unit.track.place}</Text><View style={{flexDirection:'row',flexWrap:'wrap',rowGap:12,marginTop:8}}>{unit.nodes.filter(n=>n.kind==='boss').map(n=><View key={n.id} style={{width:'33.33%',alignItems:'center'}}><BossSprite nodeId={n.id} size={84}/><Text style={{fontFamily:fonts.bodyBold,color:theme.colors.textSecondary,fontSize:11,textAlign:'center'}}>{bossForNode(n.id)?.name}</Text></View>)}</View></View>)}</View>:null}
 {tab==='you'?<View style={{padding:18,gap:18}}><GlassSurface variant="thick" style={{padding:18,gap:12}}><Text style={[heading,{fontSize:21}]}>Appearance</Text><View style={{flexDirection:'row',gap:12}}>{(['light','dark','system'] as const).map(mode=><Pressable key={mode} accessibilityRole="button" accessibilityLabel={`${mode} appearance`} onPress={()=>appearance.setPreference(mode)} style={{padding:12,borderRadius:18,backgroundColor:theme.colors.primaryTint}}><Text style={{fontFamily:fonts.bodyBold,color:theme.colors.ink}}>{mode}</Text></Pressable>)}</View></GlassSurface><Text style={heading}>Study buddies</Text><View style={{flexDirection:'row',flexWrap:'wrap',gap:12}}>{COMPANIONS.map(c=><View key={c.id} style={[theme.card,{width:140,padding:12,borderRadius:24,alignItems:'center'}]}><CompanionSprite id={c.id} size={104}/><Text style={{fontFamily:fonts.displayHeavy,color:theme.colors.ink,fontSize:18}}>{c.name}</Text></View>)}</View></View>:null}
 </ScrollView><QuestTabBar active={tab} onChange={setTab}/></View></View>;
}
function DesignPreview(){return <ThemeProvider><SafeAreaProvider><Preview/></SafeAreaProvider></ThemeProvider>;}
registerRootComponent(DesignPreview);

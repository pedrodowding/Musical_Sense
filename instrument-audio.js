/**
 * Configurações por tipo de fonte. Intervalos de altura apenas para reduzir
 * ruído e erros de oitava. Não representam uma limitação musical do aluno.
 */
export const AUDIO_PROFILES=Object.freeze({
 piano:{minHz:60,maxHz:1280,fftSize:4096,highpass:40,minRms:.007,stableFrames:3,analysisMs:65},
 keyboard:{minHz:60,maxHz:1280,fftSize:4096,highpass:40,minRms:.007,stableFrames:3,analysisMs:65},
 acoustic:{minHz:74,maxHz:1160,fftSize:4096,highpass:50,minRms:.009,stableFrames:3,analysisMs:65},
 electric:{minHz:74,maxHz:1350,fftSize:4096,highpass:50,minRms:.008,stableFrames:3,analysisMs:65},
 ukulele:{minHz:175,maxHz:1500,fftSize:4096,highpass:95,minRms:.007,stableFrames:3,analysisMs:65},
 "bass-guitar":{minHz:37,maxHz:600,fftSize:8192,highpass:28,minRms:.005,stableFrames:3,analysisMs:85},
 voice:{minHz:74,maxHz:1300,fftSize:4096,highpass:62,minRms:.006,stableFrames:3,analysisMs:65}
});
export const DEFAULT_AUDIO_PROFILE="piano";
export function audioProfile(id){
 return AUDIO_PROFILES[id]||AUDIO_PROFILES[DEFAULT_AUDIO_PROFILE];
}
export function sensitivityThreshold(profile,sensitivity=.7,noiseFloor=0){
 const p=audioProfile(profile);
 const s=Math.max(0,Math.min(1,Number.isFinite(Number(sensitivity))?Number(sensitivity):.7));
 const quiet=Math.max(0,Number(noiseFloor)||0);
 const base=p.minRms*(1.8-1.12*s);
 const noiseGate=quiet*(3.2-.8*s);
 return Math.max(p.minRms*.8,Math.min(.085,Math.max(base,noiseGate)));
}
export function calibrateNoise(samples,profile,sensitivity=.7){
 const usable=(Array.isArray(samples)?samples:[]).filter(x=>Number.isFinite(x)&&x>=0&&x<1).sort((a,b)=>a-b);
 if(usable.length<10)return {ok:false,reason:"Poucas amostras. Tente novamente em um ambiente silencioso."};
 const middle=Math.floor(usable.length/2);
 const median=usable.length%2?usable[middle]:(usable[middle-1]+usable[middle])/2;
 const p90=usable[Math.min(usable.length-1,Math.floor(usable.length*.9))];
 if(p90>.11)return {ok:false,reason:"Há muito som no ambiente. Faça a calibração sem tocar ou cantar."};
 return {ok:true,noiseFloor:median,threshold:sensitivityThreshold(profile,sensitivity,median),sampleCount:usable.length,
  environment:median>.02?"ruidoso":median>.008?"moderado":"silencioso"};
}

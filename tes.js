const fs = require('fs')
const os = require('os')

function getUpTime(){
  let upTimeSeconds = os.uptime()
  let upTimeInfo = '';
  let upTimeDays = Math.floor(upTimeSeconds / 86400);
  upTimeSeconds -= upTimeDays * 86400;
  let upTimeHours = Math.floor(upTimeSeconds / 3600);
  upTimeSeconds -= upTimeHours * 3600;
  let upTimeMinutes = Math.floor(upTimeSeconds / 60);
  upTimeSeconds -= upTimeMinutes * 60;

  if(upTimeDays > 0){
      upTimeInfo += `${upTimeDays} day(s) `
  }
  if(upTimeHours > 0){
      upTimeInfo += `${upTimeHours} hour(s) `
  }
  if(upTimeMinutes > 0){
      upTimeInfo += `${upTimeMinutes} minute(s) `
  }
  upTimeInfo += `${upTimeSeconds.toFixed(2)} second(s)`
  return upTimeInfo
}

function getMemoryInfo(){
  const memoryInfo = {
      total: 0,
      free: 0,
      cache: 0
  };

  const data = fs.readFileSync("/proc/meminfo", "utf-8");
  const lines = data.split("\n");

  for (const line of lines){
      if (line.startsWith("MemTotal")){
          memoryInfo.total = parseInt(line.split(":")[1].trim().replace(" kB", ""));
      } else if (line.startsWith("Cached")){
          memoryInfo.cache = parseInt(line.split(":")[1].trim().replace(" kB", ""));
      } else if (line.startsWith("MemFree")){
          memoryInfo.free = parseInt(line.split(":")[1].trim().replace(" kB", ""))
      }
  }
  return memoryInfo;
}

function getCPUInfo(){
  const cpuInfo = {
      name: 'Unknown',
      cores: 0,
      threads: 0
  };

  const data = fs.readFileSync("/proc/cpuinfo", "utf-8");
  const lines = data.split("\n")

  for (const line of lines){
      if (line.startsWith("model name")){
          cpuInfo.name = line.split(":")[1].trim();
      } else if (line.startsWith("processor")){
          cpuInfo.cores += 1
      } else if (line.startsWith("siblings")){
          cpuInfo.threads = parseInt(line.split(":")[1].trim())
      }
  }
  return cpuInfo
}

const valuekB = 1048576;

const totalMemory = parseFloat((getMemoryInfo().total / valuekB).toFixed(2));
const cacheMemory = parseFloat((getMemoryInfo().cache / valuekB).toFixed(2));
const freeMemory = parseFloat((getMemoryInfo().cache / valuekB).toFixed(2));
const usedMemory = parseFloat((totalMemory - (cacheMemory + freeMemory)).toFixed(2));
const memoryPercent = parseFloat((((usedMemory + cacheMemory) / totalMemory) * 100).toFixed(1));

console.log(getUpTime())

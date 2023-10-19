import psutil

def getCPUPercent():
    cpuPercent = psutil.cpu_percent(interval=1)
    return cpuPercent 

if __name__ == '__main__':
    cpuPercentage = getCPUPercent()
    print(cpuPercentage)
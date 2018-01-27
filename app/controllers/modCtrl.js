angular.module('App').controller('modCtrl', ['$scope', '$rootScope', ($scope, $rootScope) => {
  $scope.state = 'Stopped'
  $scope.hint = 'Inactive'
  $rootScope.downloading = false
  $scope.canCancel = false
  $rootScope.downSpeed = 0
  $rootScope.upSpeed = 0
  $scope.totalProgress = ''
  $scope.totalSize = 0
  $scope.totalDownloaded = 0
  $scope.totalETA = ''
  $scope.totalPeers = 0
  $scope.maxConns = 0
  $scope.fileName = ''
  $scope.fileProgress = ''

  ipcRenderer.on('to-app', (event, args) => {
    switch (args.type) {
      case 'mod-callback':
        $scope.mods = args.data.data
        $scope.loading = false
        $scope.checkUpdates()
        $scope.$apply()
        $('#modScroll').perfectScrollbar()
        break
      case 'update-dl-progress-server':
        $scope.update({
          state: 'Server - Connected',
          hint: 'Download via server is running',
          downloading: true,
          canCancel: true,
          downSpeed: prettyBytes(args.state.speed),
          upSpeed: 0,
          totalProgress: helpers.toFileProgress(args.state.totalSize, args.state.totalDownloaded + args.state.size.transferred),
          totalSize: prettyBytes(args.state.totalSize),
          totalDownloaded: prettyBytes(args.state.totalDownloaded + args.state.size.transferred),
          totalETA: humanizeDuration(Math.round(((args.state.totalSize - (args.state.totalDownloaded + args.state.size.transferred)) / args.state.speed) * 1000), {
            language: 'de',
            round: true
          }),
          totalPeers: 0,
          maxConns: 0,
          fileName: helpers.cutName(args.state.fileName),
          fileProgress: helpers.toProgress(args.state.percent)
        })
        $scope.pushToChart(new Date().getTime(), args.state.speed)
        $scope.$apply()
        break
      case 'update-dl-progress-server-bisign':
        $scope.update({
          state: 'Server - Connected',
          hint: 'Download via server is running',
          downloading: true,
          canCancel: true,
          downSpeed: 0,
          upSpeed: 0,
          totalProgress: helpers.toFileProgress(args.state.totalSize, args.state.totalDownloaded),
          totalSize: prettyBytes(args.state.totalSize),
          totalDownloaded: prettyBytes(args.state.totalDownloaded),
          totalETA: 'Lade .bisign Dateien',
          totalPeers: 0,
          maxConns: 0,
          fileName: helpers.cutName(args.state.fileName),
          fileProgress: 100
        })
        $scope.pushToChart(new Date().getTime(), args.state.speed)
        $scope.$apply()
        break
      case 'update-dl-progress-torrent':
        $scope.update({
          state: 'Torrent - Connected',
          hint: 'Download via Torrent running',
          downloading: true,
          canCancel: true,
          downSpeed: prettyBytes(args.state.torrentDownloadSpeedState),
          upSpeed: prettyBytes(args.state.torrentUploadSpeedState),
          totalProgress: helpers.toProgress(args.state.torrentProgressState),
          totalSize: prettyBytes(args.state.torrentSizeState),
          totalDownloaded: prettyBytes(args.state.torrentDownloadedState),
          totalETA: humanizeDuration(Math.round(args.state.torrentETAState), {language: 'de', round: true}),
          totalPeers: args.state.torrentNumPeersState,
          maxConns: args.state.torrentMaxConnsState,
          fileName: '',
          fileProgress: ''
        })
        $scope.pushToChart(new Date().getTime(), args.state.torrentDownloadSpeedState, args.state.torrentUploadSpeedState)
        $scope.$apply()
        break
      case 'update-chickcheck-progress':
        $scope.update({
          state: 'Version differences are being determined',
          hint: 'Checking files to determine what mods you require.',
          downloading: true,
          canCancel: false,
          downSpeed: 0,
          upSpeed: 0,
          totalProgress: helpers.toProgress(args.state.index / args.state.size),
          totalSize: 0,
          totalDownloaded: 0,
          totalETA: '',
          totalPeers: 0,
          maxConns: 0,
          fileName: helpers.cutName(args.fileName),
          fileProgress: ''
        })
        break
      case 'update-dl-progress-seeding':
        $scope.update({
          state: 'Torrent - Seeding',
          hint: '',
          downloading: true,
          canCancel: true,
          downSpeed: 0,
          upSpeed: prettyBytes(args.state.torrentUploadSpeedState),
          totalProgress: '',
          totalDownloaded: 0,
          totalETA: '',
          totalPeers: args.state.torrentNumPeersState,
          maxConns: args.state.torrentMaxConnsState,
          fileName: '',
          fileProgress: ''
        })
        break
      case 'torrent-init':
        $scope.update({
          state: 'Torrent - Connected',
          hint: '5 - 10 Minutes',
          downloading: true,
          canCancel: false,
          downSpeed: 0,
          upSpeed: 0,
          totalProgress: '',
          totalSize: 0,
          totalDownloaded: 0,
          totalETA: '',
          totalPeers: 0,
          maxConns: 0,
          fileName: '',
          fileProgress: ''
        })
        break
      case 'status-change':
        $scope.update({
          state: args.status,
          hint: args.hint,
          downloading: args.downloading,
          canCancel: true,
          downSpeed: 0,
          upSpeed: 0,
          totalProgress: '',
          totalSize: 0,
          totalDownloaded: 0,
          totalETA: '',
          totalPeers: 0,
          maxConns: 0,
          fileName: '',
          fileProgress: ''
        })
        break
      case 'update-hash-progress':
        $scope.update({
          state: 'Check - Running',
          hint: '5 - 10 Minutes',
          downloading: true,
          canCancel: true,
          downSpeed: 0,
          upSpeed: 0,
          totalProgress: helpers.toProgress(args.state.totalChecked / args.state.totalFileSize),
          totalSize: prettyBytes(args.state.totalFileSize),
          totalDownloaded: prettyBytes(args.state.totalChecked),
          totalETA: '',
          totalPeers: 0,
          maxConns: 0,
          fileName: helpers.cutName(args.fileName),
          fileProgress: ''
        })
        break
      case 'update-hash-progress-done':
        $scope.update({
          state: 'Check - Completed',
          hint: '',
          downloading: false,
          canCancel: true,
          downSpeed: 0,
          upSpeed: 0,
          totalProgress: 100,
          totalSize: 0,
          totalDownloaded: 0,
          totalETA: '',
          totalPeers: 0,
          maxConns: 0,
          fileName: '',
          fileProgress: ''
        })
        let size = 0
        args.list.forEach((cur) => {
          size += cur.Size
        })
        if (size !== 0) {
          if (size > 100000000) {
            if (args.mod.Torrent !== '' && args.mod.Torrent !== null) {
              alertify.set({labels: {ok: 'Torrent', cancel: 'Server'}})
              alertify.confirm(args.list.length + ' Files need to be downloaded (' + prettyBytes(size) + ')', (e) => {
                if (e) {
                  $scope.reset()
                  $scope.initListDownload(args.list, true, args.mod)
                } else {
                  $scope.reset()
                  $scope.initListDownload(args.list, false, args.mod)
                }
              })
            } else {
              $scope.initListDownload(args.list, false, args.mod)
            }
          } else {
            $scope.initListDownload(args.list, false, args.mod)
          }
          helpers.spawnNotification(args.list.length + ' Files need to be downloaded (' + prettyBytes(size) + ')')
          $scope.$apply()
        } else {
          helpers.spawnNotification('Review completed - Mod is up to date.')
          $scope.reset()
        }
        break
      case 'update-torrent-progress-init':
        $scope.update({
          state: 'Torrent - Connect',
          hint: '5 - 10 Minutes',
          downloading: true,
          canCancel: true,
          downSpeed: 0,
          upSpeed: 0,
          totalProgress: helpers.toProgress(args.state.torrentUploadSpeedState),
          totalSize: 0,
          totalDownloaded: 0,
          totalETA: '',
          totalPeers: 0,
          maxConns: 0,
          fileName: '',
          fileProgress: ''
        })
        break
      case 'update-dl-progress-done':
        $scope.state = 'Completed'
        $scope.progress = 100
        helpers.spawnNotification('Download Completed.')
        $scope.reset()
        $scope.checkUpdates()
        break
      case 'cancelled':
        $scope.reset()
        $scope.checkUpdates()
        break
      case 'notification-callback':
        if (args.data.Active) {
          alertify.set({labels: {ok: 'Conclude'}})
          alertify.alert(args.data.Notification)
        }
        break
      case 'update-quickcheck':
        $scope.mods.forEach((mod) => {
          if (mod.Id === args.mod.Id) {
            if (args.update === 0) {
              mod.state = [1, 'Download']
            } else if (args.update === 1) {
              mod.state = [2, 'Update Available']
            } else {
              mod.state = [3, 'Play']
            }
          }
        })
        $scope.$apply()
        break
    }
  })

  $scope.reset = () => {
    $scope.update({
      state: 'Stopped',
      hint: '',
      downloading: false,
      canCancel: false,
      downSpeed: 0,
      upSpeed: 0,
      totalProgress: '',
      totalSize: 0,
      totalDownloaded: 0,
      totalETA: '',
      totalPeers: 0,
      maxConns: 0,
      fileName: '',
      fileProgress: ''
    })
    $scope.resetChart()
  }

  $scope.init = () => {
    $scope.loading = true
    try {
      fs.lstatSync(app.getPath('userData') + '\\settings.json')
      $scope.initGraph()
    } catch (e) {
      $scope.checkregkeys()
    }
  }

  $scope.initTorrent = (mod) => {
    alertify.log('Seeding started', 'primary')
    ipcRenderer.send('to-dwn', {
      type: 'start-mod-seed',
      mod: mod,
      path: $rootScope.ArmaPath
    })
  }

  $scope.initDownload = (mod) => {
    alertify.log('Download started', 'primary')
    ipcRenderer.send('to-dwn', {
      type: 'start-mod-dwn',
      mod: mod,
      path: $rootScope.ArmaPath
    })
  }

  $scope.initHash = (mod) => {
    alertify.log('Check started', 'primary')
    ipcRenderer.send('to-dwn', {
      type: 'start-mod-hash',
      mod: mod,
      path: $rootScope.ArmaPath
    })
  }

  $scope.initUpdate = (mod) => {
    alertify.log('Update started', 'primary')
    ipcRenderer.send('to-dwn', {
      type: 'start-mod-update',
      mod: mod,
      path: $rootScope.ArmaPath
    })
  }

  $scope.initListDownload = (list, torrent, mod) => {
    $scope.update({
      state: 'Download is starting ...',
      hint: '',
      downloading: true,
      canCancel: true,
      downSpeed: 0,
      upSpeed: 0,
      totalProgress: 0,
      totalSize: 0,
      totalDownloaded: 0,
      totalETA: '',
      totalPeers: 0,
      maxConns: 0,
      fileName: '',
      fileProgress: ''
    })
    ipcRenderer.send('to-dwn', {
      type: 'start-list-dwn',
      list: list,
      torrent: torrent,
      mod: mod,
      path: $rootScope.ArmaPath
    })
  }

  $scope.initGraph = () => {
    let graphColorUp, graphColorDown

    if ($rootScope.theme === 'light') {
      graphColorDown = '#2780e3'
      graphColorUp = '#2f8912'
    } else if ($rootScope.theme === 'dark') {
      graphColorDown = '#df691a'
      graphColorUp = '#5cb85c'
    }

    let barChartData = {
      labels: [],
      datasets: [{
        label: 'Download Speed',
        shortLabel: 'Down',
        backgroundColor: graphColorDown,
        data: []
      }, {
        label: 'Upload Speed',
        shortLabel: 'Up',
        backgroundColor: graphColorUp,
        data: []
      }]
    }

    $scope.chart = new Chart($('#bar-chart'), {
      type: 'bar',
      data: barChartData,
      options: {
        responsive: true,
        legend: {
          display: false
        },
        scales: {
          xAxes: [{
            display: false,
            barThickness: 30,
            barPercentage: 0.9
          }],
          yAxes: [{
            ticks: {
              callback: (value) => {
                return value + ' MB/s'
              },
              min: 0
            }
          }]
        },
        tooltips: {
          callbacks: {
            title: (tooltipItems, data) => {
              return ''
            },
            label: (tooltipItem, data) => {
              return data.datasets[tooltipItem.datasetIndex].shortLabel + ': ' + data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index] + ' MB/s'
            }
          },
          displayColors: false
        },
        title: {
          display: false
        }
      }
    })

    for (let x = 0; x < 19; x++) {
      $scope.chart.data.labels.push(x)
      $scope.chart.data.datasets[0].data.push(0)
      $scope.chart.data.datasets[1].data.push(0)
    }
  }

  $scope.pushToChart = (label, down = 0, up = 0) => {
    if ($scope.chart.data.datasets[0].data.length > 20) {
      $scope.chart.data.labels.shift()
      $scope.chart.data.datasets[0].data.shift()
      $scope.chart.data.datasets[1].data.shift()
    }
    if (down || up) {
      $scope.chart.data.labels.push(label)
      $scope.chart.data.datasets[0].data.push(helpers.toMB(down))
      $scope.chart.data.datasets[1].data.push(helpers.toMB(up))
      $scope.chart.update()
    }
  }

  $scope.resetChart = () => {
    $scope.chart.data.labels = []
    $scope.chart.data.datasets[0].data = []
    $scope.chart.data.datasets[1].data = []
    for (let x = 0; x < 19; x++) {
      $scope.chart.data.labels.push(x)
      $scope.chart.data.datasets[0].data.push(0)
      $scope.chart.data.datasets[1].data.push(0)
    }
    $scope.chart.update()
  }

  $scope.cancel = () => {
    alertify.log('Cancelled', 'primary')
    ipcRenderer.send('to-dwn', {
      type: 'cancel'
    })
  }

  $rootScope.$watch(
    'theme', () => {
      if ($scope.chart) {
        let graphColorUp, graphColorDown

        if ($rootScope.theme === 'light') {
          graphColorDown = '#2780e3'
          graphColorUp = '#2f8912'
        } else if ($rootScope.theme === 'dark') {
          graphColorDown = '#df691a'
          graphColorUp = '#5cb85c'
        }
        if ($scope.chart) {
          $scope.chart.data.datasets[0].backgroundColor = graphColorDown
          $scope.chart.data.datasets[1].backgroundColor = graphColorUp
        }
      }
    }, true)

  $scope.update = (update) => {
    $scope.state = update.state
    $scope.hint = update.hint
    $rootScope.downloading = update.downloading
    $scope.canCancel = update.canCancel
    $rootScope.downSpeed = update.downSpeed
    $rootScope.upSpeed = update.upSpeed
    $scope.totalProgress = update.totalProgress
    $scope.totalSize = update.totalSize
    $scope.totalDownloaded = update.totalDownloaded
    $scope.totalPeers = update.totalPeers
    $scope.maxConns = update.maxConns
    $scope.fileName = update.fileName
    $scope.fileProgress = update.fileProgress
    if (update.totalETA === 'Infinity Years') {
      $scope.totalETA = 'Computing...'
    } else {
      $scope.totalETA = update.totalETA
    }
    $scope.$apply()
  }

  $scope.$watch(
    'totalProgress', () => {
      ipcRenderer.send('winprogress-change', {
        progress: $scope.totalProgress / 100
      })
    }, true)

  $rootScope.$watch(
    'ArmaPath', () => {
      if ($scope.mods !== undefined) {
        $scope.checkUpdates()
      }
    }, true)

  $scope.action = (mod) => {
    switch (mod.state[0]) {
      case 0:
        $rootScope.slide = 5
        break
      case 1:
        $scope.initDownload(mod)
        break
      case 2:
        $scope.initUpdate(mod)
        break
      case 3:
        $rootScope.slide = 1
        break
      default:
        break
    }
  }

  $scope.openModDir = (mod) => {
    shell.showItemInFolder(path.join($rootScope.ArmaPath, mod.Directories, 'addons'))
  }

  $scope.checkUpdates = () => {
    $scope.mods.forEach((mod) => {
      if (mod.HasGameFiles) {
        if ($rootScope.ArmaPath) {
          mod.state = [0, 'Search for updates...']
          ipcRenderer.send('to-dwn', {
            type: 'start-mod-quickcheck',
            mod: mod,
            path: $rootScope.ArmaPath
          })
        } else {
          mod.state = [0, 'No path set']
        }
      } else {
        mod.state = [3, 'Play']
      }
    })
  }

  $scope.savePath = (path) => {
    if (path !== false) {
      alertify.set({labels: {ok: 'Correct', cancel: 'Incorrect'}})
      alertify.confirm('Possible Arma path found: ' + path, (e) => {
        if (e) {
          $rootScope.ArmaPath = path + '\\'
          storage.set('settings', {armapath: $rootScope.ArmaPath}, (err) => {
            if (err) throw err
          })
          $rootScope.getMods()
        } else {
          $rootScope.slide = 5
          alertify.log('Please select your Arma path', 'primary')
        }
      })
    } else {
      alertify.log('No arma path found', 'danger')
    }
  }

  $scope.checkregkeys = () => {
    config.regKeys.every((cur, i) => {
      let regKey = new Winreg({
        hive: Winreg.HKLM,
        key: cur.key
      })

      regKey.keyExists((err, exists) => {
        if (err) throw err
        if (exists) {
          regKey.values((err, items) => {
            if (err) throw err
            if (fs.existsSync(items[cur.index].value + '\\arma3.exe')) {
              $scope.savePath(items[cur.index].value)
              return false
            }
          })
        }
      })
      return true
    })
    $scope.savePath(false)
  }
}])

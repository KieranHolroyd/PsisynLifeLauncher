const App = angular.module('App', ['720kb.tooltips']).run(($rootScope) => {
  $rootScope.downloading = false
  $rootScope.AppLoaded = true
  $rootScope.ArmaPath = ''
  $rootScope.slide = 0
  $rootScope.theme = 'light'
  $rootScope.updating = false
  $rootScope.update_ready = false
  $rootScope.player_data = null
  $rootScope.apiKey = ''
  $rootScope.logged_in = false
  $rootScope.logging_in = false
  $rootScope.map = null

  if (typeof process.env.PORTABLE_EXECUTABLE_DIR !== 'undefined') {
    $rootScope.portable = true
    $rootScope.AppTitle = 'Psisyn Life - ' + app.getVersion() + ' Portable - Mods'
  } else {
    $rootScope.portable = false
    $rootScope.AppTitle = 'Psisyn Life - ' + app.getVersion() + ' - Mods'
  }

  storage.get('settings', (err, data) => {
    if (err) {
      $rootScope.theme = 'dark'
      throw err
    }

    if (typeof data.theme !== 'undefined') {
      $rootScope.theme = data.theme
    }
  })

  storage.get('agreement', (err, data) => {
    if (err) {
      ipcRenderer.send('open-agreement')
      throw err
    }

    if (data.version !== config.PRIVACY_POLICY_VERSION) {
      ipcRenderer.send('open-agreement')
    }
  })

  storage.get('player', (err, data) => {
    if (err) throw err

    if (typeof data.apikey !== 'undefined') {
      $rootScope.apiKey = data.apikey
      $rootScope.logging_in = true
      helpers.getPlayerData($rootScope.apiKey)
    } else {
      storage.get('settings', (err, data) => {
        if (err) throw err
        $rootScope.ArmaPath = data.armapath
        $rootScope.getMods()
      })
    }
  })

  $rootScope.relaunchUpdate = () => {
    ipcRenderer.send('quitAndInstall')
  }

  $rootScope.refresh = () => {
    storage.get('settings', (err) => {
      if (err) throw err
      $rootScope.getMods()
    })
    helpers.getServers()
    helpers.getChangelog()
    helpers.getTwitch()
    if ($rootScope.logged_in) {
      helpers.getPlayerData($rootScope.apiKey)
    }
  }

  $rootScope.login = () => {
    alertify.set({labels: {ok: 'Login', cancel: 'Cancel'}})
    alertify.prompt('Please insert your login token', (e, str) => {
      if (e) {
        if (str) {
          $.ajax({
            url: config.APIBaseURL + config.APIValidatePlayerURL + str,
            type: 'GET',
            success: (data) => {
              if (data.status === 'Success') {
                alertify.success('Welcome ' + data.name)
                storage.set('player', {apikey: str}, (err) => {
                  if (err) throw err
                })
                $rootScope.apiKey = str
                $rootScope.logging_in = true
                helpers.getPlayerData(str)
                $rootScope.$apply()
              } else {
                $rootScope.login()
                alertify.log('Wrong key', 'danger')
                $rootScope.login()
              }
            }
          })
        } else {
          $rootScope.login()
        }
      }
    }, '')
  }

  $rootScope.logout = () => {
    storage.remove('player', (err) => {
      if (err) throw err
    })
    $rootScope.ApiKey = ''
    $rootScope.player_data = null
    $rootScope.logged_in = false
    storage.get('settings', (err) => {
      if (err) throw err
      $rootScope.getMods()
    })
  }

  $rootScope.getMods = () => {
    let url = config.APIBaseURL + config.APIModsURL
    if ($rootScope.logged_in) {
      url += '/' + $rootScope.apiKey;
    }
    ipcRenderer.send('to-web', {
      type: 'get-url',
      callback: 'mod-callback',
      url: url,
      callBackTarget: 'to-app'
    })
  }

  ipcRenderer.on('to-app', (event, args) => {
    if (typeof args.args !== 'undefined') {
      if (args.args.callback === 'player-callback') {
        $rootScope.player_data = args.data.data[0]
        $rootScope.player_data.last_change = moment(new Date($rootScope.player_data.last_change)).format('H:mm, DD.MM.YYYY')
        $rootScope.player_data.cash_readable = $rootScope.player_data.cash.toString().replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1.')
        $rootScope.player_data.bankacc_readable = $rootScope.player_data.bankacc.toString().replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1.')
        $rootScope.player_data.exp_readable = $rootScope.player_data.exp.toString().replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1.')
        if ($rootScope.player_data.level !== 30) {
          $rootScope.player_data.exp_progress = Math.round(($rootScope.player_data.exp - (($rootScope.player_data.level - 1) * ($rootScope.player_data.level - 1) * 1000)) / (($rootScope.player_data.level * $rootScope.player_data.level * 1000) - (($rootScope.player_data.level - 1) * ($rootScope.player_data.level - 1) * 1000)) * 100)
        } else {
          $rootScope.player_data.exp_progress = 100
        }

        $rootScope.logged_in = true
        $rootScope.logging_in = false
        storage.get('settings', (err, data) => {
          if (err) throw err
          $rootScope.ArmaPath = data.armapath
          $rootScope.getMods()
        })
        $rootScope.$apply()
      }
    }
  })

  ipcRenderer.on('checking-for-update', () => {
    alertify.log('Search for updates ...', 'primary')
    $rootScope.updating = true
    $rootScope.$apply()
  })

  ipcRenderer.on('update-not-available', () => {
    alertify.log('Launcher is up to date', 'primary')
    $rootScope.updating = false
    $rootScope.$apply()
  })

  ipcRenderer.on('update-available', () => {
    helpers.spawnNotification('Update available, loading ...')
    alertify.log('Update available, loading ...', 'primary')
    $rootScope.updating = true
    $rootScope.$apply()
  })

  ipcRenderer.on('update-downloaded', (event, args) => {
    helpers.spawnNotification('Update to the version ' + args.releaseName + ' ready.')
    $rootScope.updating = false
    $rootScope.update_ready = true
    $rootScope.$apply()
  })

  $rootScope.$on('ngRepeatFinished', () => {
    $rootScope.tour = new Shepherd.Tour({
      defaults: {
        classes: 'shepherd-theme-square-dark'
      }
    })

    $rootScope.tour.addStep('start', {
      title: 'Welcome',
      text: 'Hello! You have just loaded our launcher, we want to invite you on a short tour to make you familiar with it.',
      buttons: [{
        text: 'No thanks',
        classes: 'shepherd-button-secondary',
        action: $rootScope.endTour
      }, {
        text: 'Continue',
        action: $rootScope.tour.next
      }]
    })

    $rootScope.tour.addStep('mods', {
      title: 'Mods',
      text: 'Here you can download and check our mods and start the game.',
      attachTo: '.modsTabBtn bottom',
      buttons: {
        text: 'Continue',
        action: $rootScope.tour.next
      },
      when: {
        show: () => {
          $rootScope.slide = 0
          $rootScope.$apply()
        }
      }
    })

    $rootScope.tour.addStep('servers', {
      title: 'Server',
      text: 'Here you can find all our servers and information about them, also you can join from this tab directly to a server.',
      attachTo: '.serversTabBtn bottom',
      buttons: {
        text: 'Continue',
        action: $rootScope.tour.next
      },
      when: {
        show: () => {
          $rootScope.slide = 1
          $rootScope.$apply()
        }
      }
    })

    $rootScope.tour.addStep('player', {
      title: 'Profile',
      text: 'After you have logged in you will find your player data here.',
      attachTo: '.playerTabBtn bottom',
      buttons: {
        text: 'Continue',
        action: $rootScope.tour.next
      },
      when: {
        show: () => {
          $rootScope.slide = 2
          $rootScope.$apply()
        }
      }
    })

    $rootScope.tour.addStep('changelog', {
      title: 'Changelog',
      text: 'Here you will always find all changes to the mission, the map and the mods.',
      attachTo: '.changelogTabBtn bottom',
      buttons: {
        text: 'Continue',
        action: $rootScope.tour.next
      },
      when: {
        show: () => {
          $rootScope.slide = 3
          $rootScope.$apply()
        }
      }
    })

    $rootScope.tour.addStep('tfar', {
      title: 'Task Force Radio',
      text: 'Here you can install the Task Force Radio Plugin for your Teamspeak 3 client, as well as a skin that is in ReallifeRPG style.',
      attachTo: '.tfarTabBtn bottom',
      buttons: {
        text: 'Continue',
        action: $rootScope.tour.next
      },
      when: {
        show: () => {
          $rootScope.slide = 4
          $rootScope.$apply()
        }
      }
    })

    $rootScope.tour.addStep('settings', {
      title: 'Settings',
      text: 'Here you will find settings such as the Arma 3 path, CPU number, launcher theme and much more.',
      attachTo: '.settingsTabBtn bottom',
      buttons: {
        text: 'Continue',
        action: $rootScope.tour.next
      },
      when: {
        show: () => {
          $rootScope.slide = 5
          $rootScope.$apply()
        }
      }
    })

    $rootScope.tour.addStep('faq', {
      title: 'FAQ',
      text: 'Here many frequently asked questions are answered directly. Look here for a moment before you get in support, maybe your question will be answered directly.',
      attachTo: '.faqTabBtn bottom',
      buttons: {
        text: 'Continue',
        action: $rootScope.tour.next
      },
      when: {
        show: () => {
          $rootScope.slide = 6
          $rootScope.$apply()
        }
      }
    })

    $rootScope.tour.addStep('Twitch', {
      title: 'Twitch',
      text: 'Here you will always find streamers playing on our server.',
      attachTo: '.twitchTabBtn bottom',
      buttons: {
        text: 'Continue',
        action: $rootScope.tour.next
      },
      when: {
        show: () => {
          $rootScope.slide = 7
          $rootScope.$apply()
        }
      }
    })

    $rootScope.tour.addStep('map', {
      title: 'Map',
      text: 'Here is a map of Nozaki Island where you can see the fill level of all gas stations.',
      attachTo: '.mapTabBtn bottom',
      buttons: {
        text: 'Continue',
        action: $rootScope.tour.next
      },
      when: {
        show: () => {
          $rootScope.slide = 8
          $rootScope.$apply()
        }
      }
    })

    $rootScope.tour.addStep('about', {
      title: 'About',
      text: 'Here you can find general information about the launcher.',
      attachTo: '.aboutTabBtn bottom',
      buttons: {
        text: 'Continue',
        action: $rootScope.tour.next
      },
      when: {
        show: () => {
          $rootScope.slide = 9
          $rootScope.$apply()
        }
      }
    })

    $rootScope.tour.addStep('end', {
      title: 'Have Fun!',
      text: 'Enough read, download our mod, install Task Force Radio, enter the server and discover your very own way to play PsisynRP.',
      buttons: {
        text: 'End Tour',
        action: $rootScope.endTour
      },
      when: {
        show: () => {
          $rootScope.slide = 0
          $rootScope.$apply()
        }
      }
    })

    storage.get('tour', (err, data) => {
      if (err) {
        throw err
      }
      if (typeof data.tour === 'undefined' || data.tour === null) {
        $rootScope.tour.start()
      }
    })
  })

  $rootScope.endTour = () => {
    $rootScope.tour.cancel()
    storage.set('tour', {tour: true}, (err) => {
      if (err) throw err
    })
  }
})

App.directive('onFinishRender', ($timeout) => {
  return {
    restrict: 'A',
    link: (scope, element, attr) => {
      if (scope.$last === true) {
        $timeout(() => {
          scope.$emit(attr.onFinishRender)
          helpers.appLoaded()
        })
      }
    }
  }
})

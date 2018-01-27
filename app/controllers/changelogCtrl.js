angular.module('App').controller('changelogCtrl', ['$scope', ($scope) => {
  ipcRenderer.on('to-app', (event, args) => {
    switch (args.type) {
      case 'changelog-callback':
        $scope.changelogs = args.data.data
        $scope.loading = false
        $scope.$apply()
        break
    }
  })

  $scope.init = () => {
    $scope.loading = true
    helpers.getChangelog()
  }
}])

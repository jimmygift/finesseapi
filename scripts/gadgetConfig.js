
exports.getGadgetConfig = function(agentExt,teamName,gadgetConfig){

  var getGadgetConfigByTeam = function(team){
        for (teamConfig in gadgetConfig){
          for (param in gadgetConfig[teamConfig]) {
            if (param=='team' && gadgetConfig[teamConfig]['team'] == team) {
              return gadgetConfig[teamConfig];
            }
          }
        }
      };

  if (agentExt) {
    for (teamIdx in gadgetConfig){
      for (param in gadgetConfig[teamIdx]){
        if (param=='agents') {
          for (agentIdx in gadgetConfig[teamIdx]['agents']){
            if(gadgetConfig[teamIdx]['agents'][agentIdx]==agentExt){
              return gadgetConfig[teamIdx];
            };
          }
        }
      }
    };
    return getGadgetConfigByTeam(teamName);
  } else if (teamName) {
    return getGadgetConfigByTeam(teamName);
  };
};

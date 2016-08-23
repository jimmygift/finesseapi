var KafkaRest = require('kafka-rest'),
    nconf     = require('nconf'),
    logger    = require('./logger.js');

nconf.argv()
      .env()
      .file({ file: './config/config.json' });

// init the kafka process
logger.info('Connecting to kafka...');

var kafka_url   = nconf.get('kafka-rest'),
    kafka_topic = nconf.get('kafka-topic'),
    kafka = new KafkaRest({ 'url': kafka_url});

// kafka.brokers is a Brokers instance, list() returns a list of Broker instances
kafka.brokers.list(function(err,brokers) {
    if (brokers && brokers.length != 0) {
      logger.info(" Kafka Brokers: ");
      for(var i = 0; i < brokers.length; i++)
          logger.info(brokers[i].toString());
    } else if(err){
        logger.info("Error: " + JSON.stringify(err));
    } else {
        logger.info("No Kafka Brokers found !!");
    }
});

kafka.topics.list(function(err,topics) {
    logger.info(" Kafka Topics: ");
    for(var i = 0; i < topics.length; i++)
        logger.info(topics[i].toString());
});

// {"records":[{"value":{"sys":"hello cisco"}}]}
exports.kafka_publish=function(msg){
  kafka.topic(kafka_topic).partition(0).produce(msg,function(err,res){
    if (err) {
      logger.info('Kafka REST Produce Err: ' + JSON.stringify(err));
    }
  });
};

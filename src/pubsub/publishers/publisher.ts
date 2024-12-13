import { PubSub, Topic, Subscription } from '@google-cloud/pubsub';

interface PubSubConfig {
    projectId?: string;
    topicName?: string;
    subscriptionName?: string;
    keyFilename?: string;
}

const config: PubSubConfig = {
    projectId: process.env.PROJECT_ID,
    topicName: process.env.TOPIC_NAME,
    subscriptionName: process.env.SUBSCRIPTION_NAME,
    keyFilename: process.env.KEY_FILE,
};

const isPubSubEnabled = process.env.ENABLE_PUBSUB === 'true';

const pubsub = isPubSubEnabled
    ? new PubSub({
        projectId: config.projectId,
        keyFilename: config.keyFilename,
    })
    : null;

async function initializePubSub(): Promise<{ topic: Topic; subscription: Subscription }> {
    let topic: Topic = pubsub!.topic(config.topicName!);

    const [isTopicExists] = await topic.exists();

    if (!isTopicExists) {
        [topic] = await pubsub!.createTopic(config.topicName!);
        console.log(`Topic "${config.topicName}" created.`);
    }

    let subscription: Subscription = topic.subscription(config.subscriptionName!);
    const [isSubscriptionExists] = await subscription.exists();

    if (!isSubscriptionExists) {
        [subscription] = await topic.createSubscription(config.subscriptionName!);
        console.log(`Subscription "${config.subscriptionName}" created.`);
    }

    return { topic, subscription };
}

export async function publishMessage(data: Record<string, any>): Promise<void> {
    if (!isPubSubEnabled) {
        console.log('Pub/Sub is disabled. Message is skipped.');
        return;
    }

    const { topic } = await initializePubSub();

    const stringifyData = JSON.stringify(data);
    const bufferData = Buffer.from(stringifyData);

    await topic.publishMessage({ data: bufferData });
}

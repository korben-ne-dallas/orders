import { PubSub, Topic, Subscription, Message } from '@google-cloud/pubsub';
import { db } from "../../db";
import { User } from "../../modules/user/user.entity";
import { sendEmail } from "../../modules/email/emailSender";
import { SqlEntityManager } from "@mikro-orm/postgresql";

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

if (!config.projectId || !config.topicName || !config.subscriptionName || !config.keyFilename) {
    throw new Error('Missing required configurations. Please check environment variables.');
}

const pubsub = new PubSub({
    projectId: config.projectId,
    keyFilename: config.keyFilename,
});

async function sendEmailAboutNewUser(message: Message, user: User, em: SqlEntityManager) {
    let isSuccess = true;

    try {
        user.verified = true;
        await em.flush();

        const response = await sendEmail(user.id);

        if (response.status !== 200) {
            isSuccess = false;
        }
    } catch (error) {
        isSuccess = false;
    }

    return isSuccess;
}

export async function initSubscriber() {
    let topic: Topic = pubsub.topic(config.topicName!);
    const [isTopicExists] = await topic.exists();

    if (!isTopicExists) {
        [topic] = await pubsub.createTopic(config.topicName!);
    }

    let subscription: Subscription = topic.subscription(config.subscriptionName!);
    const [isSubscriptionExists] = await subscription.exists();

    if (!isSubscriptionExists) {
        [subscription] = await topic.createSubscription(config.subscriptionName!);
    }

    subscription.on('message', async (message) => {
        try {
            const { userId } = JSON.parse(message.data.toString());

            const em = db.em.fork();
            const user = await em.findOne(User, { id: userId });

            if (user?.verified) {
                message.ack();
                return;
            }

            if (user) {
                const isSuccess = await sendEmailAboutNewUser(message, user, em);

                if (!isSuccess) {
                    user.verified = false;
                    em.flush();
                }
            }

            message.ack();
        } catch (error) {
            console.error('Error processing message:', error);
        }
    });

    subscription.on('error', (error) => {
        console.error('Received error:', error);
    });
}

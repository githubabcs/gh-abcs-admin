# 1 - Introduction to Repository Webhooks and Events
In this lab you will create and test webhooks and events
> Duration: 5-10 minutes

References:
- [About webhooks](https://docs.github.com/en/developers/webhooks-and-events/webhooks/about-webhooks)
- [Creating webhooks](https://docs.github.com/en/developers/webhooks-and-events/webhooks/creating-webhooks)
- [Securing your webhooks](https://docs.github.com/en/developers/webhooks-and-events/webhooks/securing-your-webhooks)
- [Webhook events and payloads](https://docs.github.com/en/developers/webhooks-and-events/webhooks/webhook-events-and-payloads)

## 1.1 Add repository webhook

1. Open a new browser window and go to: [smee.io](https://smee.io)
2. Create a new channel by clicking on the button `Start a new channel`
3. Copy the `Webhook Proxy URL`
4. Navigate to the `Settings > Webhooks` page of your own repository
5. Click on `Add webhook`
6. Paste the copied webhook proxy url into the field `Payload URL`
7. Change the `Content type` to `application\json`
8. Select `Send me evertyhing` for the events to trigger this webhook
9. Click `Add webhook`
10. You should see a new webhook added to your repository
11. Click on `Edit` button for the recently added webhook 
12. Switch to `Recent Deliveries` tab to see the ping event generated with the webhook creation
13. Investigate the headers and the payload
14. Navigate back to your webhook delivery channel created on step 2)
15. _(Optional)_ Create an issue, push code, open a pull request, add a label to see the triggered events and to investigate the payloads.
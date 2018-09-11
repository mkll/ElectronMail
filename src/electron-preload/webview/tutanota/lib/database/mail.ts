import * as DatabaseModel from "src/shared/model/database";
import * as Rest from "src/electron-preload/webview/tutanota/lib/rest";
import {buildBaseEntity, buildPk} from ".";
import {resolveListId} from "src/electron-preload/webview/tutanota/lib/rest/util";

export async function buildMail(mail: Rest.Model.Mail): Promise<DatabaseModel.Mail> {
    const [body, files] = await Promise.all([
        Rest.fetchEntity(Rest.Model.MailBodyTypeRef, mail.body),
        Promise.all(mail.attachments.map((id) => Rest.fetchEntity(Rest.Model.FileTypeRef, id))),
    ]);

    return Mail(mail, body, files);
}

function Mail(input: Rest.Model.Mail, body: Rest.Model.MailBody, files: Rest.Model.File[]): DatabaseModel.Mail {
    return {
        ...buildBaseEntity(input),
        conversationEntryPk: buildPk(input.conversationEntry),
        mailFolderIds: [resolveListId(input)],
        sentDate: Number(input.sentDate),
        subject: input.subject,
        body: body.text,
        sender: Address(input.sender),
        toRecipients: input.toRecipients.map(Address),
        ccRecipients: input.ccRecipients.map(Address),
        bccRecipients: input.bccRecipients.map(Address),
        attachments: files.map(File),
        unread: Boolean(input.unread),
        state: DatabaseModel.MAIL_STATE._.parseValue(input.state),
        confidential: input.confidential,
        replyType: input.replyType,
    };
}

function Address(input: Rest.Model.MailAddress): DatabaseModel.MailAddress {
    return {
        ...buildBaseEntity(input),
        name: input.name,
        address: input.address,
    };
}

function File(input: Rest.Model.File): DatabaseModel.File {
    return {
        ...buildBaseEntity(input),
        mimeType: input.mimeType,
        name: input.name,
        size: Number(input.size),
    };
}

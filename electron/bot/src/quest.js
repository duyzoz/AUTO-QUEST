"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Quest = void 0;
class Quest {
    data;
    constructor(data) {
        this.data = data;
    }
    static create(data) {
        return new Quest(data);
    }
    get id() {
        return this.data.id;
    }
    get config() {
        return this.data.config;
    }
    get userStatus() {
        return this.data.user_status;
    }
    get targetedContent() {
        return this.data.targeted_content;
    }
    get preview() {
        return this.data.preview;
    }
    get raw() {
        return this.data;
    }
    isExpired(reference = new Date()) {
        if (!this.data.config?.expires_at)
            return false;
        return reference.getTime() > new Date(this.data.config.expires_at).getTime();
    }
    isStarted(reference = new Date()) {
        if (!this.data.config?.starts_at)
            return true;
        return reference.getTime() >= new Date(this.data.config.starts_at).getTime();
    }
    isCompleted() {
        return Boolean(this.userStatus?.completed_at);
    }
    isEnrolledQuest() {
        return Boolean(this.userStatus?.enrolled_at);
    }
    hasClaimedRewards() {
        return Boolean(this.userStatus?.claimed_at);
    }
    updateUserStatus(userStatus) {
        this.data.user_status = userStatus;
    }
}
exports.Quest = Quest;

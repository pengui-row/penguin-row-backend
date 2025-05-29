import { User } from "src/authentication/entities";
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { NotificationStatus, NotificationType } from "../enums";
import { IsOptional } from "class-validator";

@Entity('notifications')
export class Notification {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column('text')
    description: string;

    @Column('timestamp')
    time_stamp: Date;

    @Column({ name: 'user_id' })
    userId: string;

    @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
    @JoinColumn({ name: 'user_id' })
    user: User;

    @Column({ name: 'user_to_notify_id', nullable: false })
    userToNotifyId: string;

    @ManyToOne(() => User, (user) => user.receivedNotifications, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_to_notify_id' })
    userToNotify: User;

    @Column({
    type: 'enum',
    enum: NotificationType,
    nullable: false,
    })
    type: NotificationType;

    @Column({
    type: 'enum',
    enum: NotificationStatus,
    default: NotificationStatus.UNREAD,
    nullable: false,
    })
    status: NotificationStatus;

    @Column({ name: 'related_entity_id', nullable: true })
    @IsOptional()
    relatedEntityId?: string;
}
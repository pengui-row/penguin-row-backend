import { Comment } from "./src/app/post/entities/comment.entity";
import { Favorite } from "./src/app/post/entities/favorite.entity";
import { Like } from "./src/app/post/entities/like.entity";
import { Post } from "./src/app/post/entities/post.entity";
import { Profile } from "./src/authentication/entities/profile.entity";
import { User } from "./src/authentication/entities/user.entity";
import { UserInfo } from "./src/authentication/entities/userInfo.entity";
import { DataSource } from "typeorm";

export default new DataSource({
    type: 'postgres',
    host: process.env.PG_HOST,
    port: parseInt(process.env.PG_PORT),
    username: process.env.PG_USERNAME,
    password: process.env.PG_PASSWORD,
    database: process.env.PG_DATABASE,
    migrations: ['migrations/**'],
    entities: [User,Profile,Post,Like,Comment,Favorite,UserInfo],
});
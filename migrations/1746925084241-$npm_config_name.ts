import { MigrationInterface, QueryRunner } from "typeorm";

export class  $npmConfigName1746925084241 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TYPE public.likes_status_enum AS ENUM ('ACTIVE', 'INACTIVE', 'DELETED', 'PENDING');
            CREATE TYPE public.comments_status_enum AS ENUM ('ACTIVE', 'INACTIVE', 'DELETED', 'PENDING');
            CREATE TYPE public.favorite_status_enum AS ENUM ('ACTIVE', 'INACTIVE', 'DELETED', 'PENDING');

            CREATE TABLE public.users (
            id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
            password text NOT NULL,
            "profileId" uuid,
            CONSTRAINT "PK_273a06d6cdc2085ee1ce7638b24" PRIMARY KEY (id),
            CONSTRAINT "REL_b1bda35cdb9a2c1b777f5541d8" UNIQUE ("profileId")
            );

            CREATE TABLE public.profile (
            id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
            email text NOT NULL,
            phone text NOT NULL,
            name text NOT NULL,
            "lastName" text NOT NULL,
            "birthDate" date NOT NULL,
            CONSTRAINT "PK_3dd8bfc97e4a77c70971591bdcb" PRIMARY KEY (id),
            CONSTRAINT "UQ_3825121222d5c17741373d8ad13" UNIQUE (email),
            CONSTRAINT "UQ_abc0939a17fd68fcd10d1095224" UNIQUE (phone)
            );

            ALTER TABLE ONLY public.users
                ADD CONSTRAINT "FK_b1bda35cdb9a2c1b777f5541d87" FOREIGN KEY ("profileId") REFERENCES public.profile(id);

            CREATE TABLE public.post (
            id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
            content text NOT NULL,
            image_url text NOT NULL,
            time_stamp timestamp without time zone NOT NULL,
            user_id uuid NOT NULL,
            CONSTRAINT "PK_be5fda3aac270b134ff9c21cdee" PRIMARY KEY (id),
            CONSTRAINT "FK_52378a74ae3724bcab44036645b" FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE
            );

            CREATE TABLE public.likes (
            id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
            user_id uuid NOT NULL,
            post_id uuid NOT NULL,
            status public.likes_status_enum DEFAULT 'ACTIVE'::public.likes_status_enum NOT NULL,
            "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
            CONSTRAINT "PK_a9323de3f8bced7539a794b4a37" PRIMARY KEY (id),
            CONSTRAINT "FK_3f519ed95f775c781a254089171" FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE,
            CONSTRAINT "FK_741df9b9b72f328a6d6f63e79ff" FOREIGN KEY (post_id) REFERENCES public.post(id) ON DELETE CASCADE
            );

            CREATE TABLE public.comments (
            id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
            content text NOT NULL,
            user_id uuid NOT NULL,
            post_id uuid NOT NULL,
            status public.comments_status_enum DEFAULT 'ACTIVE'::public.comments_status_enum NOT NULL,
            "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
            CONSTRAINT "PK_8bf68bc960f2b69e818bdb90dcb" PRIMARY KEY (id),
            CONSTRAINT "FK_259bf9825d9d198608d1b46b0b5" FOREIGN KEY (post_id) REFERENCES public.post(id) ON DELETE CASCADE,
            CONSTRAINT "FK_4c675567d2a58f0b07cef09c13d" FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE
            );

            CREATE TABLE public.favorites (
            user_id uuid NOT NULL,
            post_id uuid NOT NULL,
            "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
            status public.favorites_status_enum DEFAULT 'ACTIVE'::public.favorites_status_enum NOT NULL,
            CONSTRAINT "PK_9ba72c63a55d5b8f7deee76b1c0" PRIMARY KEY (user_id, post_id),
            CONSTRAINT "FK_0be5be648c69c6b654efde5181d" FOREIGN KEY (post_id) REFERENCES public.post(id) ON DELETE CASCADE,
            CONSTRAINT "FK_35a6b05ee3b624d0de01ee50593" FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE
            );
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP TABLE public.user_info;
            DROP TABLE public.favorites;
            DROP TABLE public.comments;
            DROP TABLE public.likes;
            DROP TABLE public.posts;
            DROP TABLE public.profile;
            DROP TABLE public.users;
            DROP TYPE public.likes_status_enum;
            DROP TYPE public.comments_status_enum;
            DROP TYPE public.favorite_status_enum;
        `);
    }

}

import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { DeepPartial, Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { User, Profile, UserInfo } from '../entities';
import { LoginUserDto, CreateUserDto, CreateUserInfoDTO, ChangePasswordDto, ChangeProfessionalInfoDto, ChangePersonalInfoDto } from '../dto';
import { JwtPayload } from '../models/jwt-payload.interface';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserInfo)
    private readonly userInfoRepository: Repository<UserInfo>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    
  ) {}

  // * Login Service
  async login(loginUserDto: LoginUserDto) {
    const { password, email } = loginUserDto;

    const user = await this.userRepository.findOne({
      where: { profile: { email } },
      select: { password: true, id: true },
      relations: { profile: true },
    });

    if (!user) throw new UnauthorizedException('Credentials are not valid');

    if (!bcrypt.compareSync(password, user.password))
      throw new UnauthorizedException('Credentials are not valid');

    return {
      user: user.profile,
      token: this.getJwtToken({ id: user.id }),
    };
  }

  // * Register Service
  async create(createUserDto: CreateUserDto) {
    try {
      const { password, ...userData } = createUserDto;

      const profile: DeepPartial<Profile> = {
        email: userData.email,
        name: userData.name,
        lastName: userData.lastName,
        birthDate: userData.birthDate,
        phone: userData.phone,
      };

      const user = this.userRepository.create({
        profile,
        password: bcrypt.hashSync(password, 10),
      });

      await this.userRepository.save(user);
      delete user.password;

      return {
        ...user,
        token: this.getJwtToken({ id: user.id }),
      };
    } catch (error) {
      this.handleDBErrors(error);
    }
  }

  async checkAuthStatus(user: User) {
    return {
      ...user,
      token: this.getJwtToken({ id: user.id }),
    };
  }

  async createUserInfo(createUserInfoDto: CreateUserInfoDTO, user_id: string): Promise<UserInfo>{
    try {
      const user = await this.userRepository.findOne({
        where: { id: user_id },
      });
      if (!user) {
        throw new NotFoundException(
          `Usuario con ID ${user_id} no encontrado`,
        );
      }
      
      const userInfo = this.userInfoRepository.create({
        interests: createUserInfoDto.interests,
        location: createUserInfoDto.location,
        professional_title: createUserInfoDto.professional_title,
        talents: createUserInfoDto.talents,
        experience: createUserInfoDto.experience,
        user: user,
      });

      return this.userInfoRepository.save(userInfo);
    } catch (error) {
      this.handleDBErrors(error);
    }
  }

  async changePasswordAuthorized(user: User, changePassword: ChangePasswordDto) {
    const { old_password, password } = changePassword;
    try {
      const updatedUser = await this.userRepository.findOne({
        where: { id: user.id },
        select: { password:true, id:true },
        relations: { profile:false },
      });
      if (!updatedUser) throw new NotFoundException('Usuario no encontrado');

      if (!bcrypt.compareSync(old_password, updatedUser.password)) {
        throw new UnauthorizedException('Credentials are not valid');
      }
      updatedUser.password = bcrypt.hashSync(password, 10);
      return this.userRepository.save(updatedUser);
    } catch (error) {
      this.handleDBErrors(error)
    }
  }

  async changeProfessionalInfo(user: User, changeProfessionalInfo: ChangeProfessionalInfoDto) {
    try {
      const updatedProfessionalInfo = await this.userInfoRepository.findOne({
        where: {
          user: { id: user.id }
        },
        select: ['id','experience','talents','location','professional_title','user']
      });
      if (!updatedProfessionalInfo) throw new NotFoundException('Información profesional no encontrada');

      updatedProfessionalInfo.experience = changeProfessionalInfo.experience || updatedProfessionalInfo.experience;
      updatedProfessionalInfo.location = changeProfessionalInfo.location || updatedProfessionalInfo.location;
      updatedProfessionalInfo.professional_title = changeProfessionalInfo.professional_title || updatedProfessionalInfo.professional_title;
      updatedProfessionalInfo.talents = changeProfessionalInfo.talents || updatedProfessionalInfo.talents;
      return this.userInfoRepository.save(updatedProfessionalInfo);
    } catch (error) {
      this.handleDBErrors(error)
    }
  }

  async changePersonalInfo(user: User, changePersonalInfo: ChangePersonalInfoDto) {
    try {
      const updatedPersonalInfo = await this.userInfoRepository.findOne({
        where: {
          user: { id: user.id }
        },
        select: ['id','interests','user']
      });
      if (!updatedPersonalInfo) throw new NotFoundException('Información profesional no encontrada');

      updatedPersonalInfo.interests = changePersonalInfo.interests || updatedPersonalInfo.interests;
      return this.userInfoRepository.save(updatedPersonalInfo);
    } catch (error) {
      this.handleDBErrors(error)
    }
  }

  private getJwtToken(payload: JwtPayload) {
    const token = this.jwtService.sign(payload);
    return token;
  }
  private handleDBErrors(error: any): never {
    if (error.code === '23505') throw new BadRequestException(error.detail);

    console.log(error);

    throw new InternalServerErrorException('Please check server logs');
  }
}

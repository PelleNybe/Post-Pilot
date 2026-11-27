import { ValidContent } from './valid.images';
import { ValidationArguments } from 'class-validator';

describe('ValidContent', () => {
  let validator: ValidContent;

  beforeEach(() => {
    validator = new ValidContent();
  });

  describe('validate', () => {
    it('should return true if content is a valid string and no images are provided', () => {
      const args: Partial<ValidationArguments> = { object: {} };
      expect(
        validator.validate('Valid content', args as ValidationArguments)
      ).toBe(true);
    });

    it('should return true if images are provided, even if content is empty', () => {
      const args: Partial<ValidationArguments> = {
        object: { image: ['image.jpg'] },
      };
      expect(validator.validate('', args as ValidationArguments)).toBe(true);
      expect(validator.validate('   ', args as ValidationArguments)).toBe(true);
    });

    it('should return true if both images and valid content are provided', () => {
      const args: Partial<ValidationArguments> = {
        object: { image: ['image.jpg'] },
      };
      expect(
        validator.validate('Valid content', args as ValidationArguments)
      ).toBe(true);
    });

    it('should return false if no images are provided and content is empty', () => {
      const args: Partial<ValidationArguments> = { object: {} };
      expect(validator.validate('', args as ValidationArguments)).toBe(false);
    });

    it('should return false if no images are provided and content is just whitespace', () => {
      const args: Partial<ValidationArguments> = { object: {} };
      expect(validator.validate('   ', args as ValidationArguments)).toBe(
        false
      );
    });

    it('should return false if no images are provided and content after stripping HTML tags is empty', () => {
      const args: Partial<ValidationArguments> = { object: {} };
      expect(
        validator.validate('<div></div>', args as ValidationArguments)
      ).toBe(false);
      expect(
        validator.validate('<p>   </p>', args as ValidationArguments)
      ).toBe(false);
    });

    it('should return true if no images are provided but content has valid text after stripping HTML tags', () => {
      const args: Partial<ValidationArguments> = { object: {} };
      expect(
        validator.validate(
          '<div>Valid content</div>',
          args as ValidationArguments
        )
      ).toBe(true);
    });

    it('should return false if args.object.image is not an array', () => {
      const args: Partial<ValidationArguments> = {
        object: { image: 'image.jpg' },
      };
      expect(validator.validate('', args as ValidationArguments)).toBe(false);
    });

    it('should return false if args.object.image is an empty array', () => {
      const args: Partial<ValidationArguments> = { object: { image: [] } };
      expect(validator.validate('', args as ValidationArguments)).toBe(false);
    });
  });

  describe('defaultMessage', () => {
    it('should return the correct default error message', () => {
      const args: Partial<ValidationArguments> = {};
      expect(validator.defaultMessage(args as ValidationArguments)).toBe(
        ' If images do not exist, content must be a non-empty string.'
      );
    });
  });
});

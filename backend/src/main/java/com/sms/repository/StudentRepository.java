package com.sms.repository;

import com.sms.entity.Student;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface StudentRepository extends JpaRepository<Student, Long> {

    boolean existsByEmail(String email);

    boolean existsByEmailAndIdNot(String email, Long id);

    @Query("""
            SELECT s FROM Student s WHERE
            (:search IS NULL OR :search = '' OR
             LOWER(s.firstName) LIKE LOWER(CONCAT('%', :search, '%')) OR
             LOWER(s.lastName) LIKE LOWER(CONCAT('%', :search, '%')) OR
             LOWER(s.email) LIKE LOWER(CONCAT('%', :search, '%')) OR
             LOWER(CONCAT(s.firstName, ' ', s.lastName)) LIKE LOWER(CONCAT('%', :search, '%')))
            AND (:major IS NULL OR :major = '' OR s.major = :major)
            ORDER BY s.lastName ASC, s.firstName ASC
            """)
    List<Student> search(@Param("search") String search, @Param("major") String major);

    @Query("SELECT DISTINCT s.major FROM Student s WHERE s.major IS NOT NULL AND TRIM(s.major) <> '' ORDER BY s.major")
    List<String> findDistinctMajors();
}
